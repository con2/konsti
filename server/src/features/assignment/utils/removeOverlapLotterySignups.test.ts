import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { removeOverlapLotterySignups } from "server/features/assignment/utils/removeOverlapLotterySignups";
import {
  mockUser,
  mockLotterySignups,
  mockUser2,
  mockUser3,
} from "server/test/mock-data/mockUser";
import { testProgramItem } from "shared/tests/testProgramItem";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { UserAssignmentResult } from "shared/types/models/result";

beforeEach(async () => {
  await mongoose.connect(globalThis.__MONGO_URI__, {
    dbName: faker.string.alphanumeric(10),
  });
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should remove overlapping lottery signups from user", async () => {
  const programItemRemovedId = "program-item-removed-id";
  const startTimeRemoved = dayjs(testProgramItem.startTime)
    .add(testProgramItem.mins - 1, "minutes")
    .toISOString();

  const programItemNotRemovedId = "program-item-not-removed-id";
  const startTimeNotRemoved = dayjs(testProgramItem.startTime)
    .add(testProgramItem.mins, "minutes")
    .toISOString();

  await saveProgramItems([
    testProgramItem,
    {
      ...testProgramItem,
      programItemId: programItemRemovedId,
      startTime: startTimeRemoved,
    },
    {
      ...testProgramItem,
      programItemId: programItemNotRemovedId,
      startTime: startTimeNotRemoved,
    },
  ]);

  // User 1 received a direct signup and overlapping lottery signups should be removed
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      mockLotterySignups[0],
      {
        programItemId: programItemRemovedId,
        priority: 1,
        signedToStartTime: startTimeRemoved,
      },
    ],
  });
  const user1Result: UserAssignmentResult = {
    username: mockUser.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  };

  // User 2 received a direct signup but doesn't have overlapping lottery signups
  await saveUser(mockUser2);
  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [
      mockLotterySignups[0],
      {
        programItemId: programItemNotRemovedId,
        priority: 1,
        signedToStartTime: startTimeNotRemoved,
      },
    ],
  });
  const user2Result: UserAssignmentResult = {
    username: mockUser2.username,
    assignmentSignup: {
      programItemId: testProgramItem.programItemId,
      priority: 1,
      signedToStartTime: testProgramItem.startTime,
    },
  };

  // User 3 didn't receive a direct signup in lottery so lottery signups are not removed
  await saveUser(mockUser3);
  await saveLotterySignups({
    username: mockUser3.username,
    lotterySignups: [
      mockLotterySignups[0],
      {
        programItemId: programItemRemovedId,
        priority: 1,
        signedToStartTime: startTimeRemoved,
      },
      {
        programItemId: programItemNotRemovedId,
        priority: 1,
        signedToStartTime: startTimeNotRemoved,
      },
    ],
  });

  const results: UserAssignmentResult[] = [user1Result, user2Result];
  const programItems = unsafelyUnwrap(await findProgramItems());

  await removeOverlapLotterySignups(results, programItems);

  // User 1: One overlapping signup removed
  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(updatedUser?.lotterySignups.length).toEqual(1);
  expect(updatedUser?.lotterySignups).toMatchObject([
    {
      programItemId: testProgramItem.programItemId,
      signedToStartTime: testProgramItem.startTime,
    },
  ]);

  // User 2: No signups removed
  const updatedUser2 = unsafelyUnwrap(await findUser(mockUser2.username));
  expect(updatedUser2?.lotterySignups.length).toEqual(2);
  expect(updatedUser2?.lotterySignups).toMatchObject([
    {
      programItemId: testProgramItem.programItemId,
      signedToStartTime: testProgramItem.startTime,
    },
    {
      programItemId: programItemNotRemovedId,
      signedToStartTime: startTimeNotRemoved,
    },
  ]);

  // User 3: No signups removed
  const updatedUser3 = unsafelyUnwrap(await findUser(mockUser3.username));
  expect(updatedUser3?.lotterySignups.length).toEqual(3);
  expect(updatedUser3?.lotterySignups).toMatchObject([
    {
      programItemId: testProgramItem.programItemId,
      signedToStartTime: testProgramItem.startTime,
    },
    {
      programItemId: programItemRemovedId,
      signedToStartTime: startTimeRemoved,
    },
    {
      programItemId: programItemNotRemovedId,
      signedToStartTime: startTimeNotRemoved,
    },
  ]);
});
