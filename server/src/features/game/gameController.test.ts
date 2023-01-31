import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import _ from "lodash";
import { startServer, closeServer } from "server/utils/server";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getJWT } from "server/utils/jwt";
import { UserGroup } from "shared/typings/models/user";
import * as kompassiModule from "server/features/game/utils/getGamesFromKompassi";
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
import { saveSignupQuestion } from "server/features/settings/settingsRepository";
import {
  findUserSignups,
  saveSignup,
} from "server/features/signup/signupRepository";

let server: Server;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  mongoUri = mongoServer.getUri();
  server = await startServer({ dbConnString: mongoUri });
});

afterEach(async () => {
  await closeServer(server);
  await mongoServer.stop();
});

describe(`GET ${ApiEndpoint.GAMES}`, () => {
  test(`should return 200`, async () => {
    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);
  });

  test(`should not return private signup messages`, async () => {
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
      message: "public message",
      private: false,
    });
    await saveSignupQuestion({
      gameId: testGame2.gameId,
      message: "private message",
      private: true,
    });

    const response = await request(server).get(ApiEndpoint.GAMES);
    expect(response.status).toEqual(200);

    const sortedGames = _.sortBy(response.body.games, "title");
    expect(sortedGames[0].users[0].signupMessage).toEqual(publicMessage);
    expect(sortedGames[1].users[0].signupMessage).toEqual("");
  });
});

describe(`POST ${ApiEndpoint.GAMES}`, () => {
  test(`should return 401 without valid authorization`, async () => {
    const response = await request(server).post(ApiEndpoint.GAMES);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with valid authorization and add games to DB", async () => {
    jest
      .spyOn(kompassiModule, "getEventProgramItems")
      .mockResolvedValue([testKompassiGame]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const games = await findGames();

    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);
  });

  test("should remove games, selectedGames, signups, and favoritedGames that are not in the server response", async () => {
    jest
      .spyOn(kompassiModule, "getEventProgramItems")
      .mockResolvedValue([testKompassiGame]);

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

    const games = await findGames();
    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);

    const updatedUser = await findUser(mockUser.username);
    expect(updatedUser?.signedGames.length).toEqual(1);
    expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
      testGame.title
    );
    expect(updatedUser?.favoritedGames.length).toEqual(1);
    expect(updatedUser?.favoritedGames[0].gameId).toEqual(testGame.gameId);

    const updatedSignups = await findUserSignups(mockUser.username);
    expect(updatedSignups.length).toEqual(1);
    expect(updatedSignups[0].game.title).toEqual(testGame.title);
  });

  test("should not modify anything if server response is invalid", async () => {
    jest
      .spyOn(kompassiModule, "getEventProgramItems")
      // @ts-expect-error: Invalid value for testing
      .mockResolvedValue({ value: "broken response" });

    await saveGames([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const games = await findGames();

    expect(games.length).toEqual(2);
    const sortedGames = _.sortBy(games, "title");
    expect(sortedGames[0].title).toEqual(testGame.title);
    expect(sortedGames[1].title).toEqual(testGame2.title);
  });

  test("should not modify anything if server response is empty array", async () => {
    jest.spyOn(kompassiModule, "getEventProgramItems").mockResolvedValue([]);

    await saveGames([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const games = await findGames();

    expect(games.length).toEqual(2);
    const sortedGames = _.sortBy(games, "title");
    expect(sortedGames[0].title).toEqual(testGame.title);
    expect(sortedGames[1].title).toEqual(testGame2.title);
  });

  test("should update changed game details", async () => {
    const newDescription = "new description";
    // Kompassi returns UTC time, by default dayjs returns local time
    const newStartTime = dayjs(testGame.startTime)
      .utc()
      .add(1, "hours")
      .format();

    jest.spyOn(kompassiModule, "getEventProgramItems").mockResolvedValue([
      {
        ...testKompassiGame,
        start_time: newStartTime,
        description: newDescription,
      },
    ]);

    await saveGames([testGame, testGame2]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const games = await findGames();

    expect(games.length).toEqual(1);
    expect(dayjs(games[0].startTime).utc().format()).toEqual(newStartTime);
    expect(games[0].description).toEqual(newDescription);
  });

  test("should remove selectedGames but not signups or favoritedGames if game start time changes", async () => {
    // Kompassi returns UTC time, by default dayjs returns local time
    const newStartTime = dayjs(testGame.startTime)
      .utc()
      .add(1, "hours")
      .format();
    jest.spyOn(kompassiModule, "getEventProgramItems").mockResolvedValue([
      {
        ...testKompassiGame,
        start_time: newStartTime,
      },
      testKompassiGame2,
    ]);

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

    const updatedUser = await findUser(mockUser.username);
    expect(updatedUser?.signedGames.length).toEqual(1);
    expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
      testGame2.title
    );
    expect(updatedUser?.favoritedGames.length).toEqual(2);

    const signups = await findUserSignups(mockUser.username);
    expect(signups.length).toEqual(2);
    expect(signups[0].userSignups[0].username).toEqual(mockUser.username);
    expect(signups[1].userSignups[0].username).toEqual(mockUser.username);
  });
});
