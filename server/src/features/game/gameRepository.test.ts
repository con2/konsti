import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { GameModel } from "server/features/game/gameSchema";
import { saveGames } from "server/features/game/gameRepository";
import { testGame } from "shared/tests/testGame";

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
  await saveGames([testGame]);

  const insertedGame = await GameModel.findOne({
    gameId: testGame.gameId,
  });
  expect(insertedGame?.gameId).toEqual(testGame.gameId);
});
