import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { mockUser, mockLotterySignups } from "server/test/mock-data/mockUser";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
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

test("should remove lottery signups for invalid program items from users", async () => {
  const programItem = new ProgramItemModel(testProgramItem);
  await programItem.save();
  const programItem2 = new ProgramItemModel(testProgramItem2);
  await programItem2.save();
  const insertedProgramItems = await ProgramItemModel.find({});
  expect(insertedProgramItems.length).toEqual(2);

  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  const insertedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(insertedUser?.lotterySignups.length).toEqual(2);

  await ProgramItemModel.deleteOne({
    programItemId: programItem.programItemId,
  });

  await removeInvalidProgramItemsFromUsers();
  const updatedUser = await UserModel.findOne({
    username: mockUser.username,
  });
  expect(updatedUser?.lotterySignups.length).toEqual(1);

  const insertedProgramItems2 = await ProgramItemModel.find({});
  expect(insertedProgramItems2.length).toEqual(1);
  expect(insertedProgramItems2[0].programItemId).toEqual(
    programItem2.programItemId,
  );
});
