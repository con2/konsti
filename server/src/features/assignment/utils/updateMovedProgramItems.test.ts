import { expect, test, afterEach, beforeEach } from "vitest";
import dayjs from "dayjs";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { mockUser, mockLotterySignups } from "server/test/mock-data/mockUser";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { updateMovedProgramItems } from "server/features/assignment/utils/updateMovedProgramItems";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should remove lottery signups for moved program items from users", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  const findProgramItemsResult = await findProgramItems();
  const insertedProgramItems = unsafelyUnwrapResult(findProgramItemsResult);
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

  await ProgramItemModel.updateOne(
    { programItemId: testProgramItem.programItemId },
    {
      startTime: dayjs(testProgramItem.startTime).add(1, "hours").toISOString(),
    },
  );

  await updateMovedProgramItems(insertedProgramItems);

  const findUserResult = await findUser(mockUser.username);
  const updatedUser = unsafelyUnwrapResult(findUserResult);

  expect(updatedUser?.lotterySignups.length).toEqual(1);
  expect(updatedUser?.lotterySignups[0].programItem.programItemId).toEqual(
    testProgramItem2.programItemId,
  );
});