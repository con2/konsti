import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { MongoDbError } from "shared/types/api/errors";
import { EventLogAction } from "shared/types/models/eventLog";
import { makeErrorResult } from "shared/utils/result";
import { db } from "server/db/mongodb";
import { getAssignmentResult } from "server/features/assignment/utils/assignmentTestUtils";
import { saveResults } from "server/features/assignment/utils/saveResults";
import {
  findProgramItemById,
  findProgramItems,
  saveLotteryRanForStartTime,
  savePassedOverForLottery,
  saveProgramItems,
} from "server/features/program-item/programItemRepository";
import { findUsers, saveUser } from "server/features/user/userRepository";
import { mockUser } from "server/test/mock-data/mockUser";
import { mockNotificationQueue } from "server/test/utils/mockNotificationQueue";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";

// Kept as the real implementations, so only the cases that need a failed write replace them
vi.mock(
  import("server/features/program-item/programItemRepository"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      saveLotteryRanForStartTime: vi.fn(actual.saveLotteryRanForStartTime),
      savePassedOverForLottery: vi.fn(actual.savePassedOverForLottery),
    };
  },
);

const { mockNotificationQueueModule } = await vi.hoisted(
  () => import("server/test/utils/mockNotificationQueueModule"),
);
vi.mock(import("server/utils/notificationQueue"), mockNotificationQueueModule);

// The retries wait between attempts, which a test has no reason to sit through
vi.mock(import("server/utils/sleep"), () => {
  return { sleep: vi.fn().mockResolvedValue(undefined) };
});

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
  mockNotificationQueue();
});

afterEach(async () => {
  vi.resetAllMocks();
  await mongoose.disconnect();
});

test("should mark the lotteried program items when the first attempt fails", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  vi.mocked(saveLotteryRanForStartTime).mockResolvedValueOnce(
    makeErrorResult(MongoDbError.UNKNOWN_ERROR),
  );

  const programItems = unsafelyUnwrap(await findProgramItems());
  unsafelyUnwrap(
    await saveResults({
      results: [getAssignmentResult({ username: mockUser.username })],
      assignmentTime: testProgramItem.startTime,
      algorithm: AssignmentAlgorithm.RANDOM,
      message: "",
      users: unsafelyUnwrap(await findUsers()),
      programItems,
      lotteriedProgramItems: programItems,
      passedOverProgramItems: [],
    }),
  );

  const programItem = unsafelyUnwrap(
    await findProgramItemById(testProgramItem.programItemId),
  );
  expect(programItem.lotteryRanForStartTime).toEqual(testProgramItem.startTime);
});

test("should still tell the winners when every attempt to mark the program items fails", async () => {
  await saveUser(mockUser);
  await saveProgramItems([testProgramItem]);

  vi.mocked(saveLotteryRanForStartTime).mockResolvedValue(
    makeErrorResult(MongoDbError.UNKNOWN_ERROR),
  );

  const programItems = unsafelyUnwrap(await findProgramItems());
  const finalResults = unsafelyUnwrap(
    await saveResults({
      results: [getAssignmentResult({ username: mockUser.username })],
      assignmentTime: testProgramItem.startTime,
      algorithm: AssignmentAlgorithm.RANDOM,
      message: "",
      users: unsafelyUnwrap(await findUsers()),
      programItems,
      lotteriedProgramItems: programItems,
      passedOverProgramItems: [],
    }),
  );

  // Only the last attempt reports the failure as an error
  expect(
    vi
      .mocked(saveLotteryRanForStartTime)
      .mock.calls.map(([, options]) => options?.willRetry),
  ).toEqual([true, true, false]);

  // The spots are saved, so the run carries on and the winner hears about it
  expect(finalResults.map((result) => result.username)).toEqual([
    mockUser.username,
  ]);
  const [user] = unsafelyUnwrap(await findUsers());
  expect(user.eventLogItems.map((item) => item.action)).toEqual([
    EventLogAction.NEW_ASSIGNMENT,
  ]);
});

test("should record the passed-over program items when the first attempt fails", async () => {
  await saveProgramItems([testProgramItem]);

  vi.mocked(savePassedOverForLottery).mockResolvedValueOnce(
    makeErrorResult(MongoDbError.UNKNOWN_ERROR),
  );

  const programItems = unsafelyUnwrap(await findProgramItems());
  unsafelyUnwrap(
    await saveResults({
      results: [],
      assignmentTime: testProgramItem.startTime,
      algorithm: AssignmentAlgorithm.RANDOM,
      message: "",
      users: [],
      programItems,
      lotteriedProgramItems: [],
      passedOverProgramItems: programItems,
    }),
  );

  const programItem = unsafelyUnwrap(
    await findProgramItemById(testProgramItem.programItemId),
  );
  expect(programItem.passedOverForLottery).toBe(true);
});
