import { Server } from "node:http";
import request from "supertest";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { sortBy } from "lodash-es";
import { expect, test, vi, afterEach, beforeEach, describe } from "vitest";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/types/models/user";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockLotterySignups,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import {
  createSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import {
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import {
  KompassiPlaystyle,
  KompassiAudience,
} from "server/kompassi/kompassiProgramItem";
import { Playstyle, ProgramType, Tag } from "shared/types/models/programItem";
import { logger } from "server/utils/logger";
import { SignupQuestionType } from "shared/types/models/settings";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  mockKompassiProgramItem,
  mockKompassiProgramItem2,
} from "server/kompassi/test/mockKompassiProgramItem";
import { GetProgramItemsResponse } from "shared/types/api/programItems";

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
  test(`should return 200`, async () => {
    const response = await request(server).get(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(200);
  });

  test(`should not return private signup messages`, async () => {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sortedProgramItems = sortBy(response.body.programItems, "title");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sortedProgramItems[0].users[0].signupMessage).toEqual(publicMessage);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sortedProgramItems[1].users[0].signupMessage).toEqual("");
  });

  test(`should not return direct signup users for hideParticipantListProgramTypes`, async () => {
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

    const expectedResponse: GetProgramItemsResponse = {
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
});

describe(`POST ${ApiEndpoint.PROGRAM_ITEMS}`, () => {
  beforeEach(() => {
    vi.spyOn(config, "event").mockReturnValue({
      ...config.event(),
      eventName: EventName.ROPECON,
    });
  });

  test(`should return 401 without valid authorization`, async () => {
    const response = await request(server).post(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with valid authorization and add program items to DB", async () => {
    const spy = vi
      .spyOn(testHelperWrapper, "getEventProgramItems")
      .mockResolvedValue({ value: [mockKompassiProgramItem] });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(spy).toHaveBeenCalledTimes(1);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems.length).toEqual(1);
    expect(programItems[0].title).toEqual(testProgramItem.title);
  });

  test("should remove program items, lottery signups, direct signups, and favorite program items that are not in the server response", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
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

    expect(programItems.length).toEqual(1);
    expect(programItems[0].title).toEqual(testProgramItem.title);

    const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
    expect(updatedUser?.favoriteProgramItemIds.length).toEqual(1);
    expect(updatedUser?.favoriteProgramItemIds[0]).toEqual(
      testProgramItem.programItemId,
    );

    const updatedSignups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(updatedSignups.length).toEqual(1);
    expect(updatedSignups[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );
  });

  test("should not modify anything if server response is invalid", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: "broken response",
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems.length).toEqual(2);
    const sortedProgramItems = sortBy(programItems, "title");
    expect(sortedProgramItems[0].title).toEqual(testProgramItem.title);
    expect(sortedProgramItems[1].title).toEqual(testProgramItem2.title);
  });

  test("should not modify anything if server response is empty array", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [],
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems.length).toEqual(2);
    const sortedProgramItems = sortBy(programItems, "title");
    expect(sortedProgramItems[0].title).toEqual(testProgramItem.title);
    expect(sortedProgramItems[1].title).toEqual(testProgramItem2.title);
  });

  test("should update changed program item details", async () => {
    const newDescription = "new description";
    const newStartTime = dayjs(testProgramItem.startTime)
      .add(1, "hours")
      .toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
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

    expect(programItems.length).toEqual(1);
    expect(dayjs(programItems[0].startTime).toISOString()).toEqual(
      newStartTime,
    );
    expect(programItems[0].description).toEqual(newDescription);
  });

  test("should remove lottery signups but not direct signups or favorite program items if program item start time changes", async () => {
    const newStartTime = dayjs(testProgramItem.startTime)
      .add(1, "hours")
      .toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
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
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
      testProgramItem2.programItemId,
    );
    expect(updatedUser?.favoriteProgramItemIds.length).toEqual(2);

    const signups = unsafelyUnwrap(
      await findUserDirectSignups(mockUser.username),
    );
    expect(signups.length).toEqual(2);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    expect(signups[1].userSignups[0].username).toEqual(mockUser.username);
  });

  test("should add program item even if program item contains unknown fields or enum values", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiProgramItem,
          cachedDimensions: {
            ...mockKompassiProgramItem.cachedDimensions,
            topic: [],
            audience: [
              KompassiAudience.BEGINNERS,
              "invalid-tag",
              undefined,
              [1],
              {},
            ],
            playstyle: [
              KompassiPlaystyle.CHARACTER_DRIVEN,
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

    expect(programItems.length).toEqual(1);
    expect(programItems[0].tags).toEqual([Tag.BEGINNER_FRIENDLY]);
    expect(programItems[0].styles).toEqual([Playstyle.CHARACTER_DRIVEN]);
    // @ts-expect-error: Testing value
    expect(programItems[0].foobar).toEqual(undefined);
  });

  test("should log invalid fields and not add program item", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
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
      "%s",
      new Error(
        "Invalid program item test-program-item at path scheduleItems,0,endTime: Expected string, received null",
      ),
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error(
        "Invalid program item test-program-item at path scheduleItems,0,startTime: Expected string, received null",
      ),
    );

    const programItems = unsafelyUnwrap(await findProgramItems());

    expect(programItems.length).toEqual(0);
  });
});
