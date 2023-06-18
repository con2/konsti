import { Server } from "http";
import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { startServer, closeServer } from "server/utils/server";
import { saveUser } from "server/features/user/userRepository";
import { mockUser, mockUser2 } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findGames, saveGames } from "server/features/game/gameRepository";
import { updateGamePopularity } from "server/features/game-popularity/updateGamePopularity";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

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

test(`Should update game popularity`, async () => {
  await saveGames([testGame, testGame2]);
  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveSignedGames({
    signedGames: [
      {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    ],
    username: mockUser.username,
  });
  await saveSignedGames({
    signedGames: [
      {
        gameDetails: testGame,
        priority: 1,
        time: testGame.startTime,
        message: "",
      },
    ],
    username: mockUser2.username,
  });

  const gamesResult = await findGames();
  const games = unsafelyUnwrapResult(gamesResult);
  expect(games.length).toEqual(2);
  const firstGame = games.find((game) => game.gameId === testGame.gameId);
  expect(firstGame?.popularity).toEqual(0);
  const secondGame = games.find((game) => game.gameId === testGame2.gameId);
  expect(secondGame?.popularity).toEqual(0);

  await updateGamePopularity();

  const updatedGamesResult = await findGames();
  const updatedGames = unsafelyUnwrapResult(updatedGamesResult);
  expect(updatedGames.length).toEqual(2);
  const updatedFirstGame = updatedGames.find(
    (game) => game.gameId === testGame.gameId
  );
  expect(updatedFirstGame?.popularity).toEqual(2);
  const updatedSecondGame = updatedGames.find(
    (game) => game.gameId === testGame2.gameId
  );
  expect(updatedSecondGame?.popularity).toEqual(0);
});
