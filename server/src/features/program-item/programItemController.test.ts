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
import { testGame, testGame2 } from "shared/tests/testGame";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockLotterySignups,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";
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
} from "server/kompassi/ropecon/kompassiGameRopecon";
import { GameStyle, Genre, Tag } from "shared/types/models/programItem";
import { logger } from "server/utils/logger";
import { SignupQuestionType } from "shared/types/models/settings";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { testHelperWrapper } from "server/kompassi/getGamesFromKompassi";
import {
  mockKompassiGameRopecon,
  mockKompassiGameRopecon2,
} from "server/kompassi/test/mockKompassiGameRopecon";

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

describe(`GET ${ApiEndpoint.GAMES}`, () => {
  test(`should return 200`, async () => {
    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);
  });

  test(`should not return private signup messages`, async () => {
    await createSettings();
    await saveProgramItems([testGame, testGame2]);
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
      programItemId: testGame.programItemId,
      questionFi: "public message",
      questionEn: "public message",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });
    await saveSignupQuestion({
      programItemId: testGame2.programItemId,
      questionFi: "private message",
      questionEn: "public message",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });

    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);

    const sortedGames = sortBy(response.body.games, "title");
    expect(sortedGames[0].users[0].signupMessage).toEqual(publicMessage);
    expect(sortedGames[1].users[0].signupMessage).toEqual("");
  });
});

describe(`POST ${ApiEndpoint.GAMES}`, () => {
  beforeEach(() => {
    vi.spyOn(config, "shared").mockReturnValue({
      ...config.shared(),
      conventionName: ConventionName.ROPECON,
    });
  });

  test(`should return 401 without valid authorization`, async () => {
    const response = await request(server).post(ApiEndpoint.GAMES);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with valid authorization and add games to DB", async () => {
    const spy = vi
      .spyOn(testHelperWrapper, "getEventProgramItems")
      .mockResolvedValue({ value: [mockKompassiGameRopecon] });

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(spy).toHaveBeenCalledTimes(1);

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);
  });

  test("should remove games, lottery signups, direct signups, and favorited games that are not in the server response", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [mockKompassiGameRopecon],
    });

    await saveProgramItems([testGame, testGame2]);
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
        testGame.programItemId,
        testGame2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItemDetails.title).toEqual(
      testGame.title,
    );
    expect(updatedUser?.favoritedProgramItems.length).toEqual(1);
    expect(updatedUser?.favoritedProgramItems[0].programItemId).toEqual(
      testGame.programItemId,
    );

    const updatedSignupsResult = await findUserDirectSignups(mockUser.username);
    const updatedSignups = unsafelyUnwrapResult(updatedSignupsResult);
    expect(updatedSignups.length).toEqual(1);
    expect(updatedSignups[0].programItem.title).toEqual(testGame.title);
  });

  test("should not modify anything if server response is invalid", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems")
      // @ts-expect-error: Invalid value for testing
      .mockResolvedValue({ value: "broken response" });

    await saveProgramItems([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(2);
    const sortedGames = sortBy(games, "title");
    expect(sortedGames[0].title).toEqual(testGame.title);
    expect(sortedGames[1].title).toEqual(testGame2.title);
  });

  test("should not modify anything if server response is empty array", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [],
    });

    await saveProgramItems([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(2);
    const sortedGames = sortBy(games, "title");
    expect(sortedGames[0].title).toEqual(testGame.title);
    expect(sortedGames[1].title).toEqual(testGame2.title);
  });

  test("should update changed game details", async () => {
    const newDescription = "new description";
    const newStartTime = dayjs(testGame.startTime)
      .add(1, "hours")
      .toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiGameRopecon,
          start_time: newStartTime,
          description: newDescription,
        },
      ],
    });

    await saveProgramItems([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(dayjs(games[0].startTime).toISOString()).toEqual(newStartTime);
    expect(games[0].description).toEqual(newDescription);
  });

  test("should remove lottery signups but not direct signups or favorited games if game start time changes", async () => {
    const newStartTime = dayjs(testGame.startTime)
      .add(1, "hours")
      .toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiGameRopecon,
          start_time: newStartTime,
        },
        mockKompassiGameRopecon2,
      ],
    });

    await saveProgramItems([testGame, testGame2]);
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
        testGame.programItemId,
        testGame2.programItemId,
      ],
    });

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.lotterySignups.length).toEqual(1);
    expect(updatedUser?.lotterySignups[0].programItemDetails.title).toEqual(
      testGame2.title,
    );
    expect(updatedUser?.favoritedProgramItems.length).toEqual(2);

    const signupsResult = await findUserDirectSignups(mockUser.username);
    const signups = unsafelyUnwrapResult(signupsResult);
    expect(signups.length).toEqual(2);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    expect(signups[1].userSignups[0].username).toEqual(mockUser.username);
  });

  test("should add game even if game contains unknown fields or enum values", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiGameRopecon,
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
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(games[0].tags).toEqual([Tag.BEGINNER_FRIENDLY]);
    expect(games[0].genres).toEqual([Genre.ADVENTURE]);
    expect(games[0].styles).toEqual([GameStyle.CHARACTER_DRIVEN]);
    // @ts-expect-error: Test
    expect(games[0].foobar).toEqual(undefined);
  });

  test("should log invalid fields and not add program item", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...mockKompassiGameRopecon,
          // @ts-expect-error: Test value
          start_time: null,
          // @ts-expect-error: Test value
          end_time: null,
        },
      ],
    });

    const errorLoggerSpy = vi.spyOn(logger, "error");

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
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

    const gamesResult = await findProgramItems();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(0);
  });
});
