import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { GameModel } from "server/features/game/gameSchema";
import { mockGame } from "server/test/mock-data/mockGame";
import { saveGames } from "server/features/game/gameRepository";

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

test("should insert new game into collection", async () => {
  await saveGames([mockGame]);

  const insertedGame = await GameModel.findOne({
    gameId: mockGame.gameId,
  });
  expect(insertedGame?.gameId).toEqual(mockGame.gameId);
});
