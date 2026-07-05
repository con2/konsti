import { expect, test, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  mockLotterySignups,
  mockUser,
  mockUser2,
} from "server/test/mock-data/mockUser";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import {
  findUserDirectSignups,
  saveDirectSignup,
} from "server/features/direct-signup/directSignupRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { createEventLogItems } from "server/test/test-data-generation/generators/createEventLogItems";
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

// The generator randomizes win/lose per start time, so assert the invariants
// that must hold for either outcome
test("every lottery signup slot gets either a newAssignment with a matching direct signup or a noAssignment", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem, testProgramItem2]);
  // Lottery signups in two different start time slots
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

  // One outcome per lottery signup slot
  expect(newAssignments.length + noAssignments.length).toEqual(2);

  // Won slots reference a lottery-signed program item and have the direct
  // signup the real assignment would create
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

test("a full program item produces a noAssignment entry instead of an assignment without a signup", async () => {
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

test("users without lottery signups get no assignment event log entries", async () => {
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
