import { randomUUID } from "node:crypto";
import { addHours, addMinutes, subMinutes } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { RemoveLotterySignupsStrategy } from "shared/config/eventConfigTypes";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { db } from "server/db/mongodb";
import { removeOverlapLotterySignups } from "server/features/assignment/utils/removeOverlapLotterySignups";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  mockLotterySignups,
  mockUser,
  mockUser2,
  mockUser3,
} from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  vi.resetAllMocks();
  await mongoose.disconnect();
});

test("should remove overlapping lottery sign-ups from user", async () => {
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.OVERLAP,
  });

  const programItemRemovedId = "program-item-removed-id";
  const startTimeRemoved = addMinutes(
    new Date(testProgramItem.startTime),
    testProgramItem.mins - 1,
  ).toISOString();

  const programItemNotRemovedId = "program-item-not-removed-id";
  const startTimeNotRemoved = addMinutes(
    new Date(testProgramItem.startTime),
    testProgramItem.mins,
  ).toISOString();

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

  // User 1 received a direct sign-up and overlapping lottery sign-ups should be removed
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

  // User 2 received a direct sign-up but doesn't have overlapping lottery sign-ups
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

  // User 3 didn't receive a direct sign-up in lottery so lottery sign-ups are not removed
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

  await removeOverlapLotterySignups(
    results,
    programItems,
    testProgramItem.startTime,
  );

  // User 1: One overlapping sign-up removed
  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(updatedUser?.lotterySignups.length).toEqual(1);
  expect(updatedUser?.lotterySignups).toMatchObject([
    {
      programItemId: testProgramItem.programItemId,
      signedToStartTime: testProgramItem.startTime,
    },
  ]);

  // User 2: No sign-ups removed
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

  // User 3: No sign-ups removed
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

test("should remove all upcoming lottery sign-ups from user", async () => {
  const timeNow = new Date(testProgramItem.startTime).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.ALL_UPCOMING,
  });

  const resultProgramItemId = "result-program-item-id";
  const resultProgramItemStartTime = new Date(timeNow).toISOString();

  const pastProgramItemId = "past-program-item-id";
  const pastProgramItemStartTime = subMinutes(
    new Date(timeNow),
    1,
  ).toISOString();

  const upcomingProgramItemId = "upcoming-program-item-id";
  const upcomingStartTime = addMinutes(new Date(timeNow), 1).toISOString();

  const upcomingProgramItemId2 = "upcoming-program-item-id-2";
  const upcomingStartTime2 = addHours(new Date(timeNow), 10).toISOString();

  await saveProgramItems([
    {
      ...testProgramItem,
      programItemId: resultProgramItemId,
      startTime: resultProgramItemStartTime,
    },
    {
      ...testProgramItem,
      programItemId: pastProgramItemId,
      startTime: pastProgramItemStartTime,
    },
    {
      ...testProgramItem,
      programItemId: upcomingProgramItemId,
      startTime: upcomingStartTime,
    },
    {
      ...testProgramItem,
      programItemId: upcomingProgramItemId2,
      startTime: upcomingStartTime2,
    },
  ]);

  // User received a direct sign-up and has one past and two upcoming lottery sign-ups
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      {
        programItemId: resultProgramItemId,
        priority: 1,
        signedToStartTime: resultProgramItemStartTime,
      },
      {
        programItemId: pastProgramItemId,
        priority: 1,
        signedToStartTime: pastProgramItemStartTime,
      },
      {
        programItemId: upcomingProgramItemId,
        priority: 1,
        signedToStartTime: upcomingStartTime,
      },
      {
        programItemId: upcomingProgramItemId2,
        priority: 1,
        signedToStartTime: upcomingStartTime2,
      },
    ],
  });
  const userResult: UserAssignmentResult = {
    username: mockUser.username,
    assignmentSignup: {
      programItemId: resultProgramItemId,
      priority: 1,
      signedToStartTime: resultProgramItemStartTime,
    },
  };

  // User 2 didn't receive a direct sign-up so lottery sign-ups are not modified
  await saveUser(mockUser2);
  await saveLotterySignups({
    username: mockUser2.username,
    lotterySignups: [
      {
        programItemId: pastProgramItemId,
        priority: 1,
        signedToStartTime: pastProgramItemStartTime,
      },
      {
        programItemId: upcomingProgramItemId,
        priority: 1,
        signedToStartTime: upcomingStartTime,
      },
    ],
  });

  const results: UserAssignmentResult[] = [userResult];
  const programItems = unsafelyUnwrap(await findProgramItems());

  await removeOverlapLotterySignups(
    results,
    programItems,
    resultProgramItemStartTime,
  );

  // Upcoming sign-ups removed
  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(updatedUser?.lotterySignups.length).toEqual(2);
  expect(updatedUser?.lotterySignups).toMatchObject([
    {
      programItemId: resultProgramItemId,
      signedToStartTime: resultProgramItemStartTime,
    },
    {
      programItemId: pastProgramItemId,
      signedToStartTime: pastProgramItemStartTime,
    },
  ]);

  // All sign-ups remaining
  const updatedUser2 = unsafelyUnwrap(await findUser(mockUser2.username));
  expect(updatedUser2?.lotterySignups.length).toEqual(2);
  expect(updatedUser2?.lotterySignups).toMatchObject([
    {
      programItemId: pastProgramItemId,
      signedToStartTime: pastProgramItemStartTime,
    },
    {
      programItemId: upcomingProgramItemId,
      signedToStartTime: upcomingStartTime,
    },
  ]);
});

test("should not remove upcoming lottery sign-ups when strategy is NONE", async () => {
  const timeNow = new Date(testProgramItem.startTime).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.NONE,
  });

  const resultProgramItemId = "result-program-item-id";
  const resultProgramItemStartTime = new Date(timeNow).toISOString();

  const upcomingProgramItemId = "upcoming-program-item-id";
  const upcomingStartTime = addMinutes(new Date(timeNow), 1).toISOString();

  await saveProgramItems([
    {
      ...testProgramItem,
      programItemId: resultProgramItemId,
      startTime: resultProgramItemStartTime,
    },
    {
      ...testProgramItem,
      programItemId: upcomingProgramItemId,
      startTime: upcomingStartTime,
    },
  ]);

  // User received a direct sign-up and has one upcoming lottery sign-up
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      {
        programItemId: resultProgramItemId,
        priority: 1,
        signedToStartTime: resultProgramItemStartTime,
      },
      {
        programItemId: upcomingProgramItemId,
        priority: 1,
        signedToStartTime: upcomingStartTime,
      },
    ],
  });
  const userResult: UserAssignmentResult = {
    username: mockUser.username,
    assignmentSignup: {
      programItemId: resultProgramItemId,
      priority: 1,
      signedToStartTime: resultProgramItemStartTime,
    },
  };

  const results: UserAssignmentResult[] = [userResult];
  const programItems = unsafelyUnwrap(await findProgramItems());

  await removeOverlapLotterySignups(
    results,
    programItems,
    resultProgramItemStartTime,
  );

  // No sign-ups removed
  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(updatedUser?.lotterySignups.length).toEqual(2);
  expect(updatedUser?.lotterySignups).toMatchObject([
    {
      programItemId: resultProgramItemId,
      signedToStartTime: resultProgramItemStartTime,
    },
    {
      programItemId: upcomingProgramItemId,
      signedToStartTime: upcomingStartTime,
    },
  ]);
});

test("should not remove upcoming lottery sign-up with past parent startTime", async () => {
  const timeNow = new Date(testProgramItem.startTime).toISOString();
  const parentStartTime = subMinutes(new Date(timeNow), 30).toISOString();

  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.ALL_UPCOMING,
    startTimesByParentIds: new Map([
      [testProgramItem.parentId, parentStartTime],
    ]),
  });

  const resultProgramItemId = "lottery-result-program-item-id";
  const resultProgramItemStartTime = new Date(timeNow).toISOString();

  const upcomingProgramItemId = "upcoming-program-item-id";
  const upcomingStartTime = addMinutes(new Date(timeNow), 1).toISOString();

  await saveProgramItems([
    {
      ...testProgramItem2,
      programItemId: resultProgramItemId,
      startTime: resultProgramItemStartTime,
    },
    {
      ...testProgramItem,
      programItemId: upcomingProgramItemId,
      startTime: upcomingStartTime,
    },
  ]);

  // User received a direct sign-up and has one upcoming lottery sign-up with parent in past
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      {
        programItemId: resultProgramItemId,
        priority: 1,
        signedToStartTime: resultProgramItemStartTime,
      },
      {
        programItemId: upcomingProgramItemId,
        priority: 1,
        signedToStartTime: upcomingStartTime,
      },
    ],
  });
  const userResult: UserAssignmentResult = {
    username: mockUser.username,
    assignmentSignup: {
      programItemId: resultProgramItemId,
      priority: 1,
      signedToStartTime: resultProgramItemStartTime,
    },
  };

  const results: UserAssignmentResult[] = [userResult];
  const programItems = unsafelyUnwrap(await findProgramItems());

  await removeOverlapLotterySignups(
    results,
    programItems,
    resultProgramItemStartTime,
  );

  // No sign-ups removed
  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  expect(updatedUser?.lotterySignups.length).toEqual(2);
  expect(updatedUser?.lotterySignups).toMatchObject([
    {
      programItemId: resultProgramItemId,
      signedToStartTime: resultProgramItemStartTime,
    },
    {
      programItemId: upcomingProgramItemId,
      signedToStartTime: upcomingStartTime,
    },
  ]);
});
