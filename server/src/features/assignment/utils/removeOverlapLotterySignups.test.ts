import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { removeOverlapLotterySignups } from "server/features/assignment/utils/removeOverlapLotterySignups";
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
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

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
  const insertedProgramItems = unsafelyUnwrap(await findProgramItems());
  expect(insertedProgramItems.length).toEqual(2);

  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  const insertedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(insertedUser?.lotterySignups.length).toEqual(2);

  const programItems = unsafelyUnwrap(await findProgramItems());
  await removeOverlapLotterySignups(mockResults, programItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(updatedUser?.lotterySignups.length).toEqual(1);
});
