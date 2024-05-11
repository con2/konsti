import { Server } from "http";
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
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import {
  KompassiGameStyleRopecon,
  KompassiGenreRopecon,
  KompassiTagRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { GameStyle, Genre, Tag } from "shared/types/models/programItem";
import { logger } from "server/utils/logger";
import { SignupQuestionType } from "shared/types/models/settings";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { testHelperWrapper } from "server/kompassi/getProgramItemsFromKompassi";
import {
  mockKompassiProgramItemRopecon,
  mockKompassiProgramItemRopecon2,
} from "server/kompassi/test/mockKompassiProgramItemRopecon";

let server: Server;

beforeEach(async () => {
  server = await startServer({
    dbConnString: globalThis.__MONGO_URI__,
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
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

    const sortedProgramItems = sortBy(response.body.programItems, "title");
    expect(sortedProgramItems[0].users[0].signupMessage).toEqual(publicMessage);
    expect(sortedProgramItems[1].users[0].signupMessage).toEqual("");
  });
});

describe(`POST ${ApiEndpoint.PROGRAM_ITEMS}`, () => {
  beforeEach(() => {
    vi.spyOn(config, "shared").mockReturnValue({
      ...config.shared(),
      conventionName: ConventionName.ROPECON,
    });
  });

  test(`should return 401 without valid authorization`, async () => {
    const response = await request(server).post(ApiEndpoint.PROGRAM_ITEMS);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with valid authorization and add program items to DB", async () => {
    const spy = vi
      .spyOn(testHelperWrapper, "getEventProgramItems")
      .mockResolvedValue({ value: [mockKompassiProgramItemRopecon] });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(spy).toHaveBeenCalledTimes(1);

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

    expect(programItems.length).toEqual(1);
    expect(programItems[0].title).toEqual(testProgramItem.title);
  });

  test("should remove program items, lottery signups, direct signups, and favorited program items that are not in the server response", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [mockKompassiProgramItemRopecon],
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
      favoritedProgramItemIds: [
        testProgramItem.programItemId,
        testProgramItem2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

    expect(programItems.length).toEqual(1);
    expect(programItems[0].title).toEqual(testProgramItem.title);

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItem.title).toEqual(
      testProgramItem.title,
    );
    expect(updatedUser?.favoritedProgramItems.length).toEqual(1);
    expect(updatedUser?.favoritedProgramItems[0].programItemId).toEqual(
      testProgramItem.programItemId,
    );

    const updatedSignupsResult = await findUserDirectSignups(mockUser.username);
    const updatedSignups = unsafelyUnwrapResult(updatedSignupsResult);
    expect(updatedSignups.length).toEqual(1);
    expect(updatedSignups[0].programItem.title).toEqual(testProgramItem.title);
  });

  test("should not modify anything if server response is invalid", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems")
      // @ts-expect-error: Invalid value for testing
      .mockResolvedValue({ value: "broken response" });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

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

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

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
          ...mockKompassiProgramItemRopecon,
          start_time: newStartTime,
          description: newDescription,
        },
      ],
    });

    await saveProgramItems([testProgramItem, testProgramItem2]);

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

    expect(programItems.length).toEqual(1);
    expect(dayjs(programItems[0].startTime).toISOString()).toEqual(
      newStartTime,
    );
    expect(programItems[0].description).toEqual(newDescription);
  });

  test("should remove lottery signups but not direct signups or favorited program items if program item start time changes", async () => {
    const newStartTime = dayjs(testProgramItem.startTime)
      .add(1, "hours")
      .toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiProgramItemRopecon,
          start_time: newStartTime,
        },
        mockKompassiProgramItemRopecon2,
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
      favoritedProgramItemIds: [
        testProgramItem.programItemId,
        testProgramItem2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItem.title).toEqual(
      testProgramItem2.title,
    );
    expect(updatedUser?.favoritedProgramItems.length).toEqual(2);

    const signupsResult = await findUserDirectSignups(mockUser.username);
    const signups = unsafelyUnwrapResult(signupsResult);
    expect(signups.length).toEqual(2);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    expect(signups[1].userSignups[0].username).toEqual(mockUser.username);
  });

  test("should add program item even if program item contains unknown fields or enum values", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiProgramItemRopecon,
          tags: [
            KompassiTagRopecon.ALOITTELIJAYSTÄVÄLLINEN,
            // @ts-expect-error: Test
            "invalid-tag",
            // @ts-expect-error: Test
            undefined,
            // @ts-expect-error: Test
            [1],
            // @ts-expect-error: Test
            {},
          ],
          genres: [
            KompassiGenreRopecon.ADVENTURE,
            // @ts-expect-error: Test
            "invalid-genre",
            // @ts-expect-error: Test
            undefined,
            // @ts-expect-error: Test
            [1],
            // @ts-expect-error: Test
            {},
          ],
          styles: [
            KompassiGameStyleRopecon.CHARACTER_DRIVEN,
            // @ts-expect-error: Test
            "invalid-style",
            // @ts-expect-error: Test
            undefined,
            // @ts-expect-error: Test
            [1],
            // @ts-expect-error: Test
            {},
          ],
          foobar: "this is unknown field",
        },
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.PROGRAM_ITEMS)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

    expect(programItems.length).toEqual(1);
    expect(programItems[0].tags).toEqual([Tag.BEGINNER_FRIENDLY]);
    expect(programItems[0].genres).toEqual([Genre.ADVENTURE]);
    expect(programItems[0].styles).toEqual([GameStyle.CHARACTER_DRIVEN]);
    // @ts-expect-error: Test
    expect(programItems[0].foobar).toEqual(undefined);
  });

  test("should log invalid fields and not add program item", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiProgramItemRopecon,
          // @ts-expect-error: Test value
          start_time: null,
          // @ts-expect-error: Test value
          end_time: null,
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
        "Invalid program item p2106 at path end_time: Expected string, received null",
      ),
    );
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      "%s",
      new Error(
        "Invalid program item p2106 at path start_time: Expected string, received null",
      ),
    );

    const programItemsResult = await findProgramItems();
    const programItems = unsafelyUnwrapResult(programItemsResult);

    expect(programItems.length).toEqual(0);
  });
});
