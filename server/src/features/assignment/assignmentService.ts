import { isBefore } from "date-fns";
import { config } from "shared/config";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import {
  getDirectSignupPhaseStarted,
  getLotterySignupEndTime,
} from "shared/utils/signupTimes";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import {
  acquireAssignmentLock,
  findOrCreateSettings,
  releaseAssignmentLock,
  setAssignmentLastRun,
} from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";

// A manual run has to land in the gap between the lottery and its direct sign-up phase: before
// it, attendees are still entering the lottery and the run would decide the start time behind
// them; after it, the run competes with the first-come queue and moves attendees out of spots
// they picked themselves. Checked here rather than inside the run because only a manual run can
// be off the mark - the cron derives the start time it targets from the current time
interface RunWindow {
  stillTakingLotterySignups: ProgramItem[];
  alreadyTakingDirectSignups: ProgramItem[];
}

const findRunWindow = async (
  assignmentTime: string,
): Promise<Result<RunWindow, MongoDbError>> => {
  const [timeNowResult, programItemsResult] = await Promise.all([
    getTimeNow(),
    findProgramItems(),
  ]);
  if (!timeNowResult.ok) {
    return timeNowResult;
  }
  const timeNow = timeNowResult.value;

  if (!programItemsResult.ok) {
    return programItemsResult;
  }

  const startingProgramItems = getStartingProgramItems(
    programItemsResult.value,
    assignmentTime,
  ).filter((programItem) => isLotterySignupProgramItem(programItem));

  return makeSuccessResult({
    stillTakingLotterySignups: startingProgramItems.filter((programItem) =>
      isBefore(timeNow, getLotterySignupEndTime(programItem)),
    ),
    alreadyTakingDirectSignups: startingProgramItems.filter((programItem) =>
      getDirectSignupPhaseStarted(programItem, timeNow),
    ),
  });
};

export const storeAssignment = async (
  assignmentTime: string,
): Promise<PostAssignmentResponse> => {
  // Ensure a settings row exists (a fresh one starts with a free lock) so the lock check
  // below fails only when an assignment genuinely ran within the window, not when the row
  // is missing
  const settingsResult = await findOrCreateSettings();
  if (!settingsResult.ok) {
    return {
      message: "Assignment failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const runWindowResult = await findRunWindow(assignmentTime);
  if (!runWindowResult.ok) {
    return {
      message: "Assignment failed",
      status: "error",
      errorId: "unknown",
    };
  }
  const { stillTakingLotterySignups, alreadyTakingDirectSignups } =
    runWindowResult.value;

  if (stillTakingLotterySignups.length > 0) {
    logger.warn(
      `Lottery signup still open for ${stillTakingLotterySignups.length} program items starting at ${assignmentTime}, skip manual assignment`,
    );
    return {
      message:
        "Lottery sign-up for this starting time is still open, so its lottery cannot be run yet",
      status: "error",
      errorId: "lotterySignupStillOpen",
    };
  }

  if (alreadyTakingDirectSignups.length > 0) {
    logger.warn(
      `Direct signup already open for ${alreadyTakingDirectSignups.length} program items starting at ${assignmentTime}, skip manual assignment`,
    );
    return {
      message:
        "Direct signup for this starting time is already open, so its lottery can no longer be run",
      status: "error",
      errorId: "directSignupAlreadyOpen",
    };
  }

  // Hold the same in-progress lock the auto-assign cron uses for the whole run so a manual run
  // can't overlap a cron run (or another manual run) and corrupt results via the non-atomic
  // save. Released in the finally below, so a failed run is immediately retryable and a crash
  // can't hold the lock past the stale timeout
  const lockResult = await acquireAssignmentLock();
  if (!lockResult.ok) {
    if (lockResult.error === MongoDbError.ASSIGNMENT_LOCK_HELD) {
      logger.warn("Assignment already running, skip manual assignment");
      return {
        message: "Assignment already running",
        status: "error",
        errorId: "assignmentInProgress",
      };
    }
    return {
      message: "Assignment failed",
      status: "error",
      errorId: "unknown",
    };
  }
  const lockToken = lockResult.value;

  try {
    const assignResultsResult = await runAssignment({
      assignmentAlgorithm: config.event().assignmentAlgorithm,
      assignmentTime,
    });

    if (!assignResultsResult.ok) {
      return {
        message: "Assignment failed",
        status: "error",
        errorId: "unknown",
      };
    }
    const assignResults = assignResultsResult.value;

    // Record the last successful run time
    await setAssignmentLastRun(new Date().toISOString());

    return {
      message: "Assignment success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      assignmentTime,
    };
  } finally {
    await releaseAssignmentLock(lockToken);
  }
};
