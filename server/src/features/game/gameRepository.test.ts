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
import { removeDeletedGames } from "server/features/game/gameUtils";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { findSignups } from "server/features/signup/signupRepository";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
});

beforeEach(async () => {
  await mongoose.connect(mongoServer.getUri(), {
    dbName: faker.string.alphanumeric(10),
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

test("should remove signup document when program item is removed", async () => {
  await saveGames([testGame]);

  const findSignupsResult = await findSignups();
  const signups = unsafelyUnwrapResult(findSignupsResult);
  expect(signups).toHaveLength(1);

  const removeDeletedGamesResult = await removeDeletedGames([]);
  const deletedGamesCount = unsafelyUnwrapResult(removeDeletedGamesResult);
  expect(deletedGamesCount).toEqual(1);

  const findSignupsResult2 = await findSignups();
  const signups2 = unsafelyUnwrapResult(findSignupsResult2);
  expect(signups2).toHaveLength(0);
});
