import { expect, test, afterEach, beforeEach } from "vitest";
import dayjs from "dayjs";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { UserModel } from "server/features/user/userSchema";
import { ProgramItemModel } from "server/features/program-item/programItemSchema";
import {
  mockUser,
  mockLotterySignups,
  mockPostDirectSignupRequest,
  mockPostDirectSignupRequest2,
} from "server/test/mock-data/mockUser";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { updateMovedProgramItems } from "server/features/assignment/utils/updateMovedProgramItems";
import { findUser, saveUser } from "server/features/user/userRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveDirectSignup } from "server/features/direct-signup/directSignupRepository";
import {
  findProgramItems,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { EventLogAction } from "shared/types/models/eventLog";

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
      startTime: dayjs(testProgramItem.startTime).add(1, "hours").toISOString(),
    },
  );

  const updatedProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(insertedProgramItems, updatedProgramItems);

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
  // Lottery signup for item A
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [mockLotterySignups[0]],
  });
  // Direct signup for a different item B
  await saveDirectSignup(mockPostDirectSignupRequest2);

  // Move both items
  await ProgramItemModel.updateOne(
    { programItemId: testProgramItem.programItemId },
    {
      startTime: dayjs(testProgramItem.startTime).add(1, "hour").toISOString(),
    },
  );
  await ProgramItemModel.updateOne(
    { programItemId: testProgramItem2.programItemId },
    {
      startTime: dayjs(testProgramItem2.startTime).add(1, "hour").toISOString(),
    },
  );

  const movedProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(originalProgramItems, movedProgramItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  const movedEventProgramItemIds = updatedUser?.eventLogItems
    .filter(
      (eventLogItem) =>
        eventLogItem.action === EventLogAction.PROGRAM_ITEM_MOVED,
    )
    .map((eventLogItem) => eventLogItem.programItemId);

  // The user should be notified about both the moved lottery item and the moved direct-signup item
  expect(movedEventProgramItemIds).toHaveLength(2);
  expect(movedEventProgramItemIds).toEqual(
    expect.arrayContaining([
      testProgramItem.programItemId,
      testProgramItem2.programItemId,
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
      startTime: dayjs(testProgramItem.startTime).add(1, "hour").toISOString(),
    },
  );

  const movedProgramItems = unsafelyUnwrap(await findProgramItems());
  await updateMovedProgramItems(originalProgramItems, movedProgramItems);

  const updatedUser = unsafelyUnwrap(await findUser(mockUser.username));
  const movedEvents = updatedUser?.eventLogItems.filter(
    (eventLogItem) => eventLogItem.action === EventLogAction.PROGRAM_ITEM_MOVED,
  );

  // Same item via both signup types -> a single notification, not two
  expect(movedEvents).toHaveLength(1);
  expect(movedEvents?.[0].programItemId).toEqual(testProgramItem.programItemId);
});
