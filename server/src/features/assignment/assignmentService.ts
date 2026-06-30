import dayjs from "dayjs";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { config } from "shared/config";
import {
  acquireAssignmentLock,
  findSettings,
  releaseAssignmentLock,
  setAssignmentLastRun,
} from "server/features/settings/settingsRepository";
import { MongoDbError } from "shared/types/api/errors";
import { logger } from "server/utils/logger";

export const storeAssignment = async (
  assignmentTime: string,
): Promise<PostAssignmentResponse> => {
  // Ensure a settings row exists (a fresh one starts with a free lock) so the lock check
  // below fails only when an assignment genuinely ran within the window, not when the row
  // is missing
  const settingsResult = await findSettings();
  if (!settingsResult.ok) {
    return {
      message: "Assignment failed",
      status: "error",
      errorId: "unknown",
    };
  }

  // Hold the same in-progress lock the auto-assign cron uses for the whole run so a manual run
  // can't overlap a cron run (or another manual run) and corrupt results via the non-atomic
  // save. Released in the finally below, so a failed run is immediately retryable and a crash
  // can't hold the lock past the stale timeout
  const lockResult = await acquireAssignmentLock();
  if (!lockResult.ok) {
    if (lockResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
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
    await setAssignmentLastRun(dayjs().toISOString());

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
