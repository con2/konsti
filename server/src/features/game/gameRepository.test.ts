import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { GameModel } from "server/features/game/gameSchema";
import { saveGames } from "server/features/game/gameRepository";
import { testGame } from "shared/tests/testGame";
import { removeDeletedGames } from "server/features/game/gameUtils";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
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

  const findSignupsResult = await findDirectSignups();
  const signups = unsafelyUnwrapResult(findSignupsResult);
  expect(signups).toHaveLength(1);

  const removeDeletedGamesResult = await removeDeletedGames([]);
  const deletedGamesCount = unsafelyUnwrapResult(removeDeletedGamesResult);
  expect(deletedGamesCount).toEqual(1);

  const findSignupsResult2 = await findDirectSignups();
  const signups2 = unsafelyUnwrapResult(findSignupsResult2);
  expect(signups2).toHaveLength(0);
});
