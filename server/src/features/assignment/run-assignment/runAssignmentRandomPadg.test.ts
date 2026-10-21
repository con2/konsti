import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { config } from "shared/config";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { testProgramItem } from "shared/tests/testProgramItem";
import { AssignmentError } from "shared/types/api/errors";
import { ProgramType } from "shared/types/models/programItem";
import { makeErrorResult } from "shared/utils/result";
import { db } from "server/db/mongodb";
import * as padgAssign from "server/features/assignment/padg/padgAssignment";
import * as randomAssign from "server/features/assignment/random/randomAssignment";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { saveUser } from "server/features/user/userRepository";
import { mockLotterySignups, mockUser } from "server/test/mock-data/mockUser";
import { mockNotificationQueue } from "server/test/utils/mockNotificationQueue";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { AssignmentResultStatus } from "server/types/resultTypes";

vi.mock<object>(
  import("server/utils/notificationQueue"),
  async (originalImport) => {
    const actual = await originalImport();
    return {
      ...actual,
      getGlobalNotificationQueueService: vi.fn(),
    };
  },
);

beforeEach(async () => {
  await db.connectToDb(globalThis.__MONGO_URI__, randomUUID());
  mockNotificationQueue();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await mongoose.disconnect();
});

test("If random assignment fails, should return PADG result", async () => {
  vi.spyOn(randomAssign, "randomAssignment").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime: testProgramItem.startTime,
    }),
  );

  expect(assignResults.algorithm).toEqual(AssignmentAlgorithm.PADG);
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
});

test("If PADG assignment fails, should return random result", async () => {
  vi.spyOn(padgAssign, "padgAssignment").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

  const assignResults = unsafelyUnwrap(
    await runAssignment({
      assignmentAlgorithm,
      assignmentTime: testProgramItem.startTime,
    }),
  );

  expect(assignResults.algorithm).toEqual(AssignmentAlgorithm.RANDOM);
  expect(assignResults.status).toEqual(AssignmentResultStatus.SUCCESS);
});

test("If both assignments fail, should return error result", async () => {
  vi.spyOn(randomAssign, "randomAssignment").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );
  vi.spyOn(padgAssign, "padgAssignment").mockReturnValueOnce(
    makeErrorResult(AssignmentError.UNKNOWN_ERROR),
  );
  vi.spyOn(config, "event").mockReturnValue({
    ...config.event(),
    twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  });

  await saveProgramItems([
    { ...testProgramItem, minAttendance: 1, maxAttendance: 1 },
  ]);
  await saveUser(mockUser);
  await saveLotterySignups({
    username: mockUser.username,
    lotterySignups: [{ ...mockLotterySignups[0], priority: 1 }],
  });

  const assignmentAlgorithm = AssignmentAlgorithm.RANDOM_PADG;

  const assignResultsResult = await runAssignment({
    assignmentAlgorithm,
    assignmentTime: testProgramItem.startTime,
  });

  expect(assignResultsResult).toEqual({
    ok: false,
    error: AssignmentError.UNKNOWN_ERROR,
  });
});
