import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { GameModel } from "server/features/game/gameSchema";
import { mockUser, mockLotterySignups } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { removeInvalidGamesFromUsers } from "server/features/player-assignment/utils/removeInvalidGamesFromUsers";
import { saveUser } from "server/features/user/userRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should remove signups for invalid games from users", async () => {
  const game = new GameModel(testGame);
  await game.save();
  const game2 = new GameModel(testGame2);
  await game2.save();
  const insertedGames = await GameModel.find({});
  expect(insertedGames.length).toEqual(2);

  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  const insertedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(insertedUser?.lotterySignups.length).toEqual(2);

  await GameModel.deleteOne({ gameId: game.gameId });

  await removeInvalidGamesFromUsers();
  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(updatedUser?.lotterySignups.length).toEqual(1);

  const insertedGames2 = await GameModel.find({});
  expect(insertedGames2.length).toEqual(1);
  expect(insertedGames2[0].gameId).toEqual(game2.gameId);
});
