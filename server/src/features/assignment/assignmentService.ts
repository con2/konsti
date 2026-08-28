import { config } from "shared/config";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { isLotterySignupProgramItem } from "shared/utils/isLotterySignupProgramItem";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getDirectSignupPhaseStarted } from "shared/utils/signupTimes";
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

// A lottery is not run once its program items have started taking direct sign-ups: it would
// compete with the first-come queue and move attendees out of spots they picked themselves.
// Checked here rather than inside the run because only a manual run can be late - the cron
// derives the start time it targets from the current time
const findProgramItemsTakingDirectSignups = async (
  assignmentTime: string,
): Promise<Result<ProgramItem[], MongoDbError>> => {
  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return timeNowResult;
  }

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }

  return makeSuccessResult(
    getStartingProgramItems(programItemsResult.value, assignmentTime)
      .filter((programItem) => isLotterySignupProgramItem(programItem))
      .filter((programItem) =>
        getDirectSignupPhaseStarted(programItem, timeNowResult.value),
      ),
  );
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

  const lateProgramItemsResult =
    await findProgramItemsTakingDirectSignups(assignmentTime);
  if (!lateProgramItemsResult.ok) {
    return {
      message: "Assignment failed",
      status: "error",
      errorId: "unknown",
    };
  }
  const lateProgramItems = lateProgramItemsResult.value;

  if (lateProgramItems.length > 0) {
    logger.warn(
      `Direct signup already open for ${lateProgramItems.length} program items starting at ${assignmentTime}, skip manual assignment`,
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
