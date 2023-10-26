import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import _ from "lodash";
import {
  expect,
  test,
  vi,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
} from "vitest";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/typings/models/user";
import { testHelperWrapper } from "server/features/game/utils/getGamesFromKompassiRopecon";
import {
  testKompassiGame,
  testKompassiGame2,
} from "server/test/mock-data/mockKompassiGame";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { testGame, testGame2 } from "shared/tests/testGame";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockPostEnteredGameRequest,
  mockPostEnteredGameRequest2,
  mockSignedGames,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";
import {
  createSettings,
  saveSignupQuestion,
} from "server/features/settings/settingsRepository";
import {
  findUserSignups,
  saveSignup,
} from "server/features/signup/signupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import {
  KompassiGameStyleRopecon,
  KompassiGenreRopecon,
  KompassiTagRopecon,
} from "shared/typings/models/kompassiGame/kompassiGameRopecon";
import { GameStyle, Genre, Tag } from "shared/typings/models/game";
import { logger } from "server/utils/logger";
import { SignupQuestionType } from "shared/typings/models/settings";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";

let server: Server;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  server = await startServer({
    dbConnString: mongoServer.getUri(),
    dbName: faker.string.alphanumeric(10),
    enableSentry: false,
  });
});

afterEach(async () => {
  await closeServer(server);
});

afterAll(async () => {
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.GAMES}`, () => {
  test(`should return 200`, async () => {
    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);
  });

  test(`should not return private signup messages`, async () => {
    await createSettings();
    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);

    const publicMessage = "Answer to public message";
    await saveSignup({
      ...mockPostEnteredGameRequest,
      message: publicMessage,
    });
    await saveSignup({
      ...mockPostEnteredGameRequest2,
      message: "Answer to private message",
    });

    await saveSignupQuestion({
      gameId: testGame.gameId,
      questionFi: "public message",
      questionEn: "public message",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });
    await saveSignupQuestion({
      gameId: testGame2.gameId,
      questionFi: "private message",
      questionEn: "public message",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    });

    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);

    const sortedGames = _.sortBy(response.body.games, "title");
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
      .mockResolvedValue({ value: [testKompassiGame] });

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);
    expect(spy).toHaveBeenCalledTimes(1);

    const gamesResult = await findGames();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);
  });

  test("should remove games, selectedGames, signups, and favoritedGames that are not in the server response", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [testKompassiGame],
    });

    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);
    await saveSignedGames({
      username: mockUser.username,
      signedGames: mockSignedGames,
    });
    await saveSignup(mockPostEnteredGameRequest);
    await saveSignup(mockPostEnteredGameRequest2);
    await saveFavorite({
      username: mockUser.username,
      favoritedGameIds: [testGame.gameId, testGame2.gameId],
    });

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findGames();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.signedGames.length).toEqual(1);
    expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
      testGame.title,
    );
    expect(updatedUser?.favoritedGames.length).toEqual(1);
    expect(updatedUser?.favoritedGames[0].gameId).toEqual(testGame.gameId);

    const updatedSignupsResult = await findUserSignups(mockUser.username);
    const updatedSignups = unsafelyUnwrapResult(updatedSignupsResult);
    expect(updatedSignups.length).toEqual(1);
    expect(updatedSignups[0].game.title).toEqual(testGame.title);
  });

  test("should not modify anything if server response is invalid", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems")
      // @ts-expect-error: Invalid value for testing
      .mockResolvedValue({ value: "broken response" });

    await saveGames([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findGames();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(2);
    const sortedGames = _.sortBy(games, "title");
    expect(sortedGames[0].title).toEqual(testGame.title);
    expect(sortedGames[1].title).toEqual(testGame2.title);
  });

  test("should not modify anything if server response is empty array", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [],
    });

    await saveGames([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findGames();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(2);
    const sortedGames = _.sortBy(games, "title");
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
          ...testKompassiGame,
          start_time: newStartTime,
          description: newDescription,
        },
      ],
    });

    await saveGames([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const gamesResult = await findGames();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(1);
    expect(dayjs(games[0].startTime).toISOString()).toEqual(newStartTime);
    expect(games[0].description).toEqual(newDescription);
  });

  test("should remove selectedGames but not signups or favoritedGames if game start time changes", async () => {
    const newStartTime = dayjs(testGame.startTime)
      .add(1, "hours")
      .toISOString();

    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...testKompassiGame,
          start_time: newStartTime,
        },
        testKompassiGame2,
      ],
    });

    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);
    await saveSignedGames({
      username: mockUser.username,
      signedGames: mockSignedGames,
    });
    await saveSignup(mockPostEnteredGameRequest);
    await saveSignup(mockPostEnteredGameRequest2);
    await saveFavorite({
      username: mockUser.username,
      favoritedGameIds: [testGame.gameId, testGame2.gameId],
    });

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const updatedUserResult = await findUser(mockUser.username);
    const updatedUser = unsafelyUnwrapResult(updatedUserResult);
    expect(updatedUser?.signedGames.length).toEqual(1);
    expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
      testGame2.title,
    );
    expect(updatedUser?.favoritedGames.length).toEqual(2);

    const signupsResult = await findUserSignups(mockUser.username);
    const signups = unsafelyUnwrapResult(signupsResult);
    expect(signups.length).toEqual(2);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    expect(signups[1].userSignups[0].username).toEqual(mockUser.username);
  });

  test("should add game even if game contains unknown fields or enum values", async () => {
    vi.spyOn(testHelperWrapper, "getEventProgramItems").mockResolvedValue({
      value: [
        {
          ...testKompassiGame,
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

    const gamesResult = await findGames();
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
          ...testKompassiGame,
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

    const gamesResult = await findGames();
    const games = unsafelyUnwrapResult(gamesResult);

    expect(games.length).toEqual(0);
  });
});
