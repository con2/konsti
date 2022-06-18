import { Server } from "http";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import moment from "moment";
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
  mockSignup,
  mockUser,
} from "server/test/mock-data/mockUser";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { saveEnteredGame } from "server/features/user/entered-game/enteredGameRepository";
import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";

let server: Server;
let mongoServer: MongoMemoryServer;
let mongoUri: string;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  mongoUri = mongoServer.getUri();
  server = await startServer(mongoUri);
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
});

describe(`POST ${ApiEndpoint.GAMES}`, () => {
  test(`should return 401 without valid authorization`, async () => {
    const response = await request(server).post(ApiEndpoint.GAMES);
    expect(response.status).toEqual(401);
  });

  test("should return 200 with valid authorization and add games to DB", async () => {
    jest
      .spyOn(kompassiModule, "getProgramFromServer")
      .mockResolvedValue([testKompassiGame]);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const games = await findGames();

    expect(games.length).toEqual(1);
    expect(games[0].title).toEqual(testGame.title);
  });

  test("should remove games, selectedGames, enteredGames, and favoritedGames that are not in the server response", async () => {
    jest
      .spyOn(kompassiModule, "getProgramFromServer")
      .mockResolvedValue([testKompassiGame]);

    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);
    await saveSignedGames(mockSignup);
    await saveEnteredGame(mockPostEnteredGameRequest);
    await saveEnteredGame(mockPostEnteredGameRequest2);
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
    expect(updatedUser?.enteredGames.length).toEqual(1);
    expect(updatedUser?.enteredGames[0].gameDetails.title).toEqual(
      testGame.title
    );
    expect(updatedUser?.favoritedGames.length).toEqual(1);
    expect(updatedUser?.favoritedGames[0].gameId).toEqual(testGame.gameId);
  });

  test("should not modify anything if server response is invalid", async () => {
    jest
      .spyOn(kompassiModule, "getProgramFromServer")
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
    jest.spyOn(kompassiModule, "getProgramFromServer").mockResolvedValue([]);

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
    const newStartTime = moment(testGame.startTime).add(1, "hours").format();
    jest.spyOn(kompassiModule, "getProgramFromServer").mockResolvedValue([
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
    expect(moment(games[0].startTime).format()).toEqual(newStartTime);
    expect(games[0].description).toEqual(newDescription);
  });

  test("should remove selectedGames and enteredGames if game start time changes", async () => {
    const newStartTime = moment(testGame.startTime).add(1, "hours").format();
    jest.spyOn(kompassiModule, "getProgramFromServer").mockResolvedValue([
      {
        ...testKompassiGame,
        start_time: newStartTime,
      },
      testKompassiGame2,
    ]);

    await saveGames([testGame, testGame2]);
    await saveUser(mockUser);
    await saveSignedGames(mockSignup);
    await saveEnteredGame(mockPostEnteredGameRequest);
    await saveEnteredGame(mockPostEnteredGameRequest2);

    const response = await request(server)
      .post(ApiEndpoint.GAMES)
      .set("Authorization", `Bearer ${getJWT(UserGroup.ADMIN, "admin")}`);
    expect(response.status).toEqual(200);

    const updatedUser = await findUser(mockUser.username);
    expect(updatedUser?.signedGames.length).toEqual(1);
    expect(updatedUser?.signedGames[0].gameDetails.title).toEqual(
      testGame2.title
    );
    expect(updatedUser?.enteredGames.length).toEqual(1);
    expect(updatedUser?.enteredGames[0].gameDetails.title).toEqual(
      testGame2.title
    );
  });
});
