import {
  expect,
  test,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { faker } from "@faker-js/faker";
import { GameModel } from "server/features/game/gameSchema";
import { saveGames } from "server/features/game/gameRepository";
import { testGame } from "shared/tests/testGame";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.random.alphaNumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

afterAll(async () => {
  await mongoServer.stop();
});

test("should insert new game into collection", async () => {
  await saveGames([testGame]);

  const insertedGame = await GameModel.findOne({
    gameId: testGame.gameId,
  });
  expect(insertedGame?.gameId).toEqual(testGame.gameId);
});
