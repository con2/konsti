import { randomUUID } from "node:crypto";
import { addHours } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { db } from "server/db/mongodb";
import { updateMovedProgramItems } from "server/features/assignment/utils/updateMovedProgramItems";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { UserModel } from "server/features/user/userSchema";
import {
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
  mockUser,
} from "server/test/mock-data/mockUser";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  await mongoose.disconnect();
});

test("should remove lottery signups for moved program items from users", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  const insertedProgramItems = unsafelyUnwrap(await findProgramItems());
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
      startTime: addHours(new Date(testProgramItem.startTime), 1).toISOString(),
    },
  );

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(updatedProgramItems, insertedProgramItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));

  expect(updatedUser?.lotterySignups.length).toEqual(1);
  expect(updatedUser?.lotterySignups[0].programItemId).toEqual(
    testProgramItem2.programItemId,
  );
});

test("should notify a user about a moved lottery signup and a moved direct signup for different items", async () => {
  await saveProgramItems([testProgramItem, testProgramItem2]);
  const originalProgramItems = unsafelyUnwrap(await findProgramItems());

  await saveUser(mockUser);
  // Lottery sign-up for item A
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [mockLotterySignups[0]],
  });
  // Direct sign-up for a different item B
  await saveDirectSignup(mockPostDirectSignupRequest2);

  // Move both items
  await ProgramItemModel.updateOne(
    { programItemId: testProgramItem.programItemId },
    {
      startTime: addHours(new Date(testProgramItem.startTime), 1).toISOString(),
    },
  );
  await ProgramItemModel.updateOne(
    { programItemId: testProgramItem2.programItemId },
    {
      startTime: addHours(
        new Date(testProgramItem2.startTime),
        1,
      ).toISOString(),
    },
  );

  const movedProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(movedProgramItems, originalProgramItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  const movedEvents = updatedUser?.eventLogItems.filter(
    (eventLogItem) => eventLogItem.action === EventLogAction.PROGRAM_ITEM_MOVED,
  );

  expect(movedEvents).toHaveLength(2);
  expect(movedEvents).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programItemId: testProgramItem.programItemId,
        programItemStartTime: addHours(
          new Date(testProgramItem.startTime),
          1,
        ).toISOString(),
      }),
      expect.objectContaining({
        programItemId: testProgramItem2.programItemId,
        programItemStartTime: addHours(
          new Date(testProgramItem2.startTime),
          1,
        ).toISOString(),
      }),
    ]),
  );
});

test("should notify a user only once for a moved item they have both a lottery and direct signup for", async () => {
  await saveProgramItems([testProgramItem]);
  const originalProgramItems = unsafelyUnwrap(await findProgramItems());

  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [mockLotterySignups[0]],
  });
  await saveDirectSignup(mockPostDirectSignupRequest);

  await ProgramItemModel.updateOne(
    { programItemId: testProgramItem.programItemId },
    {
      startTime: addHours(new Date(testProgramItem.startTime), 1).toISOString(),
    },
  );

  const movedProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(movedProgramItems, originalProgramItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  const movedEvents = updatedUser?.eventLogItems.filter(
    (eventLogItem) => eventLogItem.action === EventLogAction.PROGRAM_ITEM_MOVED,
  );

  // Same item via both sign-up types -> a single notification, not two
  expect(movedEvents).toHaveLength(1);
  expect(movedEvents?.[0].programItemId).toEqual(testProgramItem.programItemId);
  expect(movedEvents?.[0].programItemStartTime).toEqual(
    addHours(new Date(testProgramItem.startTime), 1).toISOString(),
  );
});

test("should keep lottery signups for other program items when one moves onto their slot", async () => {
  // The user holds a spot in testProgramItem and has a lottery sign-up for testProgramItem2 an
  // hour later. Moving the held item onto that hour puts the two at the same time, and the
  // lottery will decide between them - so the sign-up stays, since cancelling it cannot be
  // undone once the lottery sign-up window closes
  const lotteryStartTime = addHours(
    new Date(testProgramItem.startTime),
    1,
  ).toISOString();

  await saveProgramItems([
    testProgramItem,
    { ...testProgramItem2, startTime: lotteryStartTime },
  ]);
  await saveUser(mockUser);
  await saveDirectSignup({ ...mockPostDirectSignupRequest, priority: 1 });
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [
      {
        programItemId: testProgramItem2.programItemId,
        priority: 1,
        signedToStartTime: lotteryStartTime,
      },
    ],
  });

  const currentProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(
    [
      { ...testProgramItem, startTime: lotteryStartTime },
      { ...testProgramItem2, startTime: lotteryStartTime },
    ],
    currentProgramItems,
  );

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.lotterySignups.map((signup) => signup.programItemId)).toEqual([
    testProgramItem2.programItemId,
  ]);
});
