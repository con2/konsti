import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { mockUser, mockLotterySignups } from "server/test/mock-data/mockUser";
import { testGame, testGame2 } from "shared/tests/testGame";
import { removeInvalidProgramItemsFromUsers } from "server/features/player-assignment/utils/removeInvalidProgramItemsFromUsers";
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

test("should remove lottery signups for invalid games from users", async () => {
  const game = new ProgramItemModel(testGame);
  await game.save();
  const game2 = new ProgramItemModel(testGame2);
  await game2.save();
  const insertedGames = await ProgramItemModel.find({});
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

  await ProgramItemModel.deleteOne({ gameId: game.gameId });

  await removeInvalidProgramItemsFromUsers();
  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(updatedUser?.lotterySignups.length).toEqual(1);

  const insertedGames2 = await ProgramItemModel.find({});
  expect(insertedGames2.length).toEqual(1);
  expect(insertedGames2[0].gameId).toEqual(game2.gameId);
});
