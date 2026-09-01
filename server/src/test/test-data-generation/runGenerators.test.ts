import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import { EventLogAction } from "shared/types/models/eventLog";
import { db } from "server/db/mongodb";
import {
  findDirectSignups,
  findUserDirectSignups,
} from "server/features/direct-signup/directSignupRepository";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser, saveUser } from "server/features/user/userRepository";
import { mockLotterySignups, mockUser } from "server/test/mock-data/mockUser";
import { runGenerators } from "server/test/test-data-generation/runGenerators";
import { seedRandomness } from "server/test/utils/seedRandomness";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
});

afterEach(async () => {
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

// The programme is imported by a separate process in the kompassi and past-event flows, so the
// event log phase runs against sign-up documents only that import creates
test("event log phase empties the sign-up documents an earlier import created instead of deleting them", async () => {
  // The simulated lottery decides each slot with a coin flip, so pin it to assert a win landed
  seedRandomness();

  await saveUser(mockUser);
  await saveProgramItems([testProgramItem, testProgramItem2]);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: mockLotterySignups,
  });

  await runGenerators({ eventLog: true }, { closeDb: false });

  // A document per program item, holding no sign-ups from an earlier simulation
  expect(unsafelyUnwrap(await findDirectSignups())).toHaveLength(2);

  // Without a document to write into, every simulated win silently becomes a rejection
  const user = unsafelyUnwrap(await findUser(mockUser.username));
  const newAssignments = (user?.eventLogItems ?? []).filter(
    (eventLogItem) => eventLogItem.action === EventLogAction.NEW_ASSIGNMENT,
  );
  const directSignups = unsafelyUnwrap(
    await findUserDirectSignups(mockUser.username),
  );
  expect(newAssignments).toHaveLength(1);
  expect(directSignups).toHaveLength(1);
});
