import { randomUUID } from "node:crypto";
import { subHours } from "date-fns";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { db } from "server/db/mongodb";
import {
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
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
} from "server/test/mock-data/mockUser";
import { createEventLogItems } from "server/test/test-data-generation/generators/createEventLogItems";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  await mongoose.disconnect();
});

// The generator randomizes win/lose per start time, so assert the invariants
// that must hold for either outcome
test("every lottery sign-up slot gets either a newAssignment with a matching direct sign-up or a noAssignment", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem, testProgramItem2]);
  // Lottery sign-ups in two different start time slots
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await createEventLogItems();

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  const eventLogItems = user?.eventLogItems ?? [];
  const newAssignments = eventLogItems.filter(
    (item) => item.action === EventLogAction.NEW_ASSIGNMENT,
  );
  const noAssignments = eventLogItems.filter(
    (item) => item.action === EventLogAction.NO_ASSIGNMENT,
  );

  // One outcome per lottery sign-up slot
  expect(newAssignments.length + noAssignments.length).toEqual(2);

  // Won slots reference a lottery-signed program item and have the direct
  // sign-up the real assignment would create
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  const directSignupProgramItemIds = new Set(
    directSignups.map((signup) => signup.programItemId),
  );
  const lotterySignupProgramItemIds = new Set(
    mockLotterySignups.map((lotterySignup) => lotterySignup.programItemId),
  );
  expect(
    newAssignments.filter(
      (item) =>
        !directSignupProgramItemIds.has(item.programItemId) ||
        !lotterySignupProgramItemIds.has(item.programItemId),
    ),
  ).toEqual([]);
  expect(directSignups).toHaveLength(newAssignments.length);

  // Lost slots reference a start time the user entered the lottery for
  const lotterySignupStartTimes = new Set(
    mockLotterySignups.map((lotterySignup) => lotterySignup.signedToStartTime),
  );
  expect(
    noAssignments.filter(
      (item) => !lotterySignupStartTimes.has(item.programItemStartTime),
    ),
  ).toEqual([]);
});

test("a full program item produces a noAssignment entry instead of an assignment without a direct sign-up", async () => {
  await saveUser(mockUser);
  await saveUser(mockUser2);
  // The only lottery-signed item is already full of other attendees
  await saveProgramItems([{ ...testProgramItem, maxAttendance: 1 }]);
  await saveDirectSignup({
    username: mockUser2.username,
    directSignupProgramItemId: testProgramItem.programItemId,
    signedToStartTime: testProgramItem.startTime,
    signupTime: testProgramItem.startTime,
    message: "",
    priority: DIRECT_SIGNUP_PRIORITY,
  });
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [mockLotterySignups[0]],
  });

  await createEventLogItems();

  // Whether the slot "wins" or "loses" the coin flip, a full program item must
  // never produce a newAssignment message
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  const eventLogItems = user?.eventLogItems ?? [];
  expect(eventLogItems).toHaveLength(1);
  expect(eventLogItems[0].action).toEqual(EventLogAction.NO_ASSIGNMENT);
});

test("records the lottery it simulates, so a later programme import does not pass the program items over", async () => {
  // Before direct sign-up opens, which is the window in which an import passes an undecided
  // program item over for holding sign-ups
  vi.setSystemTime(subHours(new Date(testProgramItem.startTime), 3));

  await saveUser(mockUser);
  await saveUser(mockUser2);
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });
  // A spot the import can pass the program item over for, whichever way the simulated
  // lottery's coin flip lands
  await saveDirectSignup({
    username: mockUser2.username,
    directSignupProgramItemId: testProgramItem.programItemId,
    signedToStartTime: testProgramItem.startTime,
    signupTime: testProgramItem.startTime,
    message: "",
    priority: DIRECT_SIGNUP_PRIORITY,
  });

  await createEventLogItems();

  // Every program item whose lottery was simulated is marked, not only the ones that took a
  // winner - the real run marks the whole start time
  const programItems = unsafelyUnwrap(await findProgramItems());
  expect(
    programItems.filter(
      (programItem) => programItem.lotteryRanForStartTime === undefined,
    ),
  ).toEqual([]);

  await saveProgramItems([testProgramItem, testProgramItem2]);

  const programItemsAfterImport = unsafelyUnwrap(await findProgramItems());
  expect(
    programItemsAfterImport.filter(
      (programItem) => programItem.passedOverForLottery === true,
    ),
  ).toEqual([]);
});

test("users without lottery sign-ups get no assignment event log entries", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem, testProgramItem2]);

  await createEventLogItems();

  const user = unsafelyUnwrap(await findUser(mockUser.username));
  expect(user?.eventLogItems).toEqual([]);

  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(directSignups).toEqual([]);
});
