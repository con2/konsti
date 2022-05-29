import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { saveUser } from "server/features/user/userRepository";
import { testGame } from "shared/tests/testGame";
import { saveGames } from "server/features/game/gameRepository";
import {
  mockPostEnteredGameRequest,
  mockUser,
} from "server/test/mock-data/mockUser";
import {
  delEnteredGame,
  saveEnteredGame,
} from "server/features/user/entered-game/enteredGameRepository";

let mongoServer: MongoMemoryServer;

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test("should add new enteredGame for user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);

  const response = await saveEnteredGame(mockPostEnteredGameRequest);

  expect(response.enteredGames[0].gameDetails.gameId).toEqual(testGame.gameId);
});

test("should delete enteredGame from user", async () => {
  await saveUser(mockUser);
  await saveGames([testGame]);
  await saveEnteredGame(mockPostEnteredGameRequest);

  const response = await delEnteredGame(mockPostEnteredGameRequest);

  expect(response.enteredGames.length).toEqual(0);
});
