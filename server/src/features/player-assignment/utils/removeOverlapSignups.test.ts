import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { mockUser, mockLotterySignups } from "server/test/mock-data/mockUser";
import { mockResults } from "server/test/mock-data/mockResults";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { unsafelyUnwrapResult } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should remove overlapping lottery signups from user", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  const insertedProgramItemsResult = await findProgramItems();
  const insertedProgramItems = unsafelyUnwrapResult(insertedProgramItemsResult);
  expect(insertedProgramItems.length).toEqual(2);

  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  const insertedUserResult = await findUser(mockUser.username);
  const insertedUser = unsafelyUnwrapResult(insertedUserResult);
  expect(insertedUser?.lotterySignups.length).toEqual(2);

  await removeOverlapSignups(mockResults);

  const updatedUserResult = await findUser(mockUser.username);
  const updatedUser = unsafelyUnwrapResult(updatedUserResult);
  expect(updatedUser?.lotterySignups.length).toEqual(1);
});
