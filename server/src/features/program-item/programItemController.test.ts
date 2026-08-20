import { Server } from "node:http";
import { faker } from "@faker-js/faker";
import { addHours, subMinutes } from "date-fns";
import { sortBy } from "remeda";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { GetProgramItemsResult } from "shared/types/api/programItems";
import { EventLogAction } from "shared/types/models/eventLog";
import {
  Gamestyle,
  ProgramItemSignupStrategy,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import { SignupQuestionType } from "shared/types/models/settings";
import { UserGroup } from "shared/types/models/user";
import {
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  createSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  KompassiGamestyle,
  KompassiGrouping,
} from "server/kompassi/kompassiProgramItem";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveTestSettings } from "server/test/test-settings/testSettingsRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { getJWT } from "server/utils/jwt";
import { logger } from "server/utils/logger";
import { closeServer, startServer } from "server/utils/server";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await closeServer(server);
});

describe(`GET ${ApiEndpoint.PROGRAM_ITEMS}`, () => {
  test("should return 200", async () => {
    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);
  });

  test("should not return private signup messages", async () => {
    await createSettings();
    await saveProgramItems([testProgramItem, testProgramItem2]);
    await saveUser(mockUser);

    const publicMessage = "Answer to public message";
    await saveDirectSignup({
      ...mockPostDirectSignupRequest,
      message: publicMessage,
    });
    await saveDirectSignup({
      ...mockPostDirectSignupRequest2,
      message: "Answer to private message",
    });

    await saveSignupQuestion({
      programItemId: testProgramItem.programItemId,
      questionFi: "public message",
      questionEn: "public message",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });
    await saveSignupQuestion({
      programItemId: testProgramItem2.programItemId,
      questionFi: "private message",
      questionEn: "public message",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });

    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);

    const { programItems } = response.body as GetProgramItemsResult;

    const sortedProgramItems = sortBy(
      programItems,
      (programItem) => programItem.programItem.title,
    );
    expect(sortedProgramItems[0].users[0].signupMessage).toEqual(publicMessage);
    expect(sortedProgramItems[1].users[0].signupMessage).toEqual("");
  });

  test("should not return direct signup users for hideParticipantListProgramTypes", async () => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      hideParticipantListProgramTypes: [ProgramType.FLEAMARKET],
    });

    await createSettings();
    await saveProgramItems([
      testProgramItem,
      { ...testProgramItem2, programType: ProgramType.FLEAMARKET },
    ]);
    await saveUser(mockUser);

    await saveDirectSignup(mockPostDirectSignupRequest);
    await saveDirectSignup(mockPostDirectSignupRequest2);

    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);

    const expectedResponse: GetProgramItemsResult = {
      message: "Program items downloaded",
      status: "success",
      programItems: [
        {
          programItem: testProgramItem,
          users: [{ username: mockUser.username, signupMessage: "" }],
        },
        {
          programItem: {
            ...testProgramItem2,
            programType: ProgramType.FLEAMARKET,
          },
          users: [{ username: "redacted", signupMessage: "redacted" }],
        },
      ],
    };

    expect(response.body).toMatchObject(expectedResponse);
  });

  test("should resolve signup strategy from program item own start time when no parent start time override", async () => {
    const { eventStartTime, directSignupPhaseStart } = config.event();

    // Own start time is after the lottery cutoff (event start + 3h) so lottery applies
    const ownStartTime = addHours(new Date(eventStartTime), 8).toISOString();
    // Now is before the direct sign-up phase starts for the own start time
    const timeNow = subMinutes(
      new Date(ownStartTime),
      directSignupPhaseStart + 60,
    ).toISOString();

    await saveTestSettings({ testTime: timeNow });
    await createSettings();
    await saveProgramItems([{ ...testProgramItem, startTime: ownStartTime }]);

    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);

    const { programItems } = response.body as GetProgramItemsResult;
    expect(programItems[0].programItem.signupStrategy).toEqual(
      ProgramItemSignupStrategy.LOTTERY,
    );
  });

  test("should resolve signup strategy from parent start time override", async () => {
    const { eventStartTime, directSignupPhaseStart } = config.event();

    const ownStartTime = addHours(new Date(eventStartTime), 8).toISOString();
    // Parent start time is earlier than own start time so its direct sign-up phase has started
    const parentStartTime = addHours(new Date(eventStartTime), 5).toISOString();

    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      startTimesByParentIds: new Map([
        [testProgramItem.parentId, parentStartTime],
      ]),
    });

    // Now is before the own direct sign-up phase start, but after the parent-derived one
    const timeNow = subMinutes(
      new Date(parentStartTime),
      directSignupPhaseStart - 60,
    ).toISOString();

    await saveTestSettings({ testTime: timeNow });
    await createSettings();
    await saveProgramItems([{ ...testProgramItem, startTime: ownStartTime }]);

    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);

    const { programItems } = response.body as GetProgramItemsResult;
    // Without the parent override the own start time would resolve to LOTTERY
    expect(programItems[0].programItem.signupStrategy).toEqual(
      ProgramItemSignupStrategy.DIRECT,
    );
  });
});

describe(`POST ${ApiEndpoint.PROGRAM_ITEMS}`, () => {
  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      eventName: EventName.ROPECON,
    });
  });

  test("should return 401 without valid authorization", async () => {
    const response = await request(server).post(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with valid authorization and add program items to DB", async () => {
    const spy = vi
      .spyOn(testHelperWrapper, "getEventProgramItems")
      .mockResolvedValue({ ok: true, value: [mockKompassiProgramItem] });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(spy).toHaveBeenCalledTimes(1);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(1);
    expect(programItems[0].title).toEqual(testProgramItem.title);
  });

  test("should remove program items, lottery signups, direct signups, and favorite program items that are not in the server response", async () => {
    // Kompassi only returns one program items when there are two in DB
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [mockKompassiProgramItem],
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: mockLotterySignups,
    });
    await saveDirectSignup(mockPostDirectSignupRequest);
    await saveDirectSignup(mockPostDirectSignupRequest2);
    await saveFavorite({
      username: mockUser.username,
      favoriteProgramItemIds: [
        testProgramItem.programItemId,
        testProgramItem2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(1);
    expect(programItems[0].title).toEqual(testProgramItem.title);

    const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(updatedUser?.lotterySignups).toHaveLength(1);
    expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(updatedUser?.favoriteProgramItemIds).toHaveLength(1);
    expect(updatedUser?.favoriteProgramItemIds[0]).toEqual(
      testProgramItem.programItemId,
    );

    const updatedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(updatedSignups).toHaveLength(1);
    expect(updatedSignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
  });

  test("should not modify anything if server response is invalid", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: "broken response",
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(2);
    const sortedProgramItems = sortBy(
      programItems,
      (programItem) => programItem.title,
    );
    expect(sortedProgramItems[0].title).toEqual(testProgramItem.title);
    expect(sortedProgramItems[1].title).toEqual(testProgramItem2.title);
  });

  test("should not modify anything if server response is empty array", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [],
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(2);
    const sortedProgramItems = sortBy(
      programItems,
      (programItem) => programItem.title,
    );
    expect(sortedProgramItems[0].title).toEqual(testProgramItem.title);
    expect(sortedProgramItems[1].title).toEqual(testProgramItem2.title);
  });

  test("should update changed program item details", async () => {
    const newDescription = "new description";
    const newStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        {
          ...mockKompassiProgramItem,
          scheduleItems: [
            {
              ...mockKompassiProgramItem.scheduleItems[0],
              startTime: newStartTime,
            },
          ],
          description: newDescription,
        },
      ],
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(1);
    expect(new Date(programItems[0].startTime).toISOString()).toEqual(
      newStartTime,
    );
    expect(programItems[0].description).toEqual(newDescription);
  });

  test("should remove lottery signups but not direct signups or favorite program items if program item start time changes", async () => {
    const newStartTime = addHours(
      new Date(testProgramItem.startTime),
      1,
    ).toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        {
          ...mockKompassiProgramItem,
          scheduleItems: [
            {
              ...mockKompassiProgramItem.scheduleItems[0],
              startTime: newStartTime,
            },
          ],
        },
        mockKompassiProgramItem2,
      ],
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);
    await saveUser(mockUser);
    await saveLotterySignups({
      username: mockUser.username,
      lotterySignups: mockLotterySignups,
    });
    await saveDirectSignup(mockPostDirectSignupRequest);
    await saveDirectSignup(mockPostDirectSignupRequest2);
    await saveFavorite({
      username: mockUser.username,
      favoriteProgramItemIds: [
        testProgramItem.programItemId,
        testProgramItem2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(updatedUser?.lotterySignups).toHaveLength(1);
    expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
      testProgramItem2.programItemId,
    );
    expect(updatedUser?.favoriteProgramItemIds).toHaveLength(2);
    expect(updatedUser?.eventLogItems).toHaveLength(1);
    expect(updatedUser?.eventLogItems[0].action).toEqual(
      EventLogAction.PROGRAM_ITEM_MOVED,
    );

    const signups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signups).toHaveLength(2);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    expect(signups[1].userSignups[0].username).toEqual(mockUser.username);
  });

  test("should add program item even if program item contains unknown fields or enum values", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        {
          ...mockKompassiProgramItem,
          cachedDimensions: {
            ...mockKompassiProgramItem.cachedDimensions,
            topic: [],
            ["age-group"]: [],
            grouping: [
              KompassiGrouping.BEGINNERS,
              "invalid-tag",
              undefined,
              [1],
              {},
            ],
            ["game-style"]: [
              KompassiGamestyle.CHARACTER_DRIVEN,
              "invalid-style",
              undefined,
              [1],
              {},
            ],
          },
          foobar: "this is unknown field",
        },
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(1);
    expect(programItems[0].tags).toEqual([Tag.BEGINNER_FRIENDLY]);
    expect(programItems[0].styles).toEqual([Gamestyle.CHARACTER_DRIVEN]);
    // @ts-expect-error: Testing value
    expect(programItems[0].foobar).toEqual(undefined);
  });

  test("should log invalid fields and not add program item", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      ok: true,
      value: [
        {
          ...mockKompassiProgramItem,
          scheduleItems: [
            {
              ...mockKompassiProgramItem.scheduleItems[0],
              startTime: null,
              endTime: null,
            },
          ],
        },
      ],
    });

    const errorLoggerSpy = vi.spyOn(logger, "error");

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);

    expect(response.status).toEqual(200);

    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        "Invalid program item test-program-item at path scheduleItems.0.endTime: Invalid input: expected string, received null",
      ),
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      new Error(
        "Invalid program item test-program-item at path scheduleItems.0.startTime: Invalid input: expected string, received null",
      ),
    );

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems).toHaveLength(0);
  });
});
