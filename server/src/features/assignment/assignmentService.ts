import dayjs from "dayjs";
import { runAssignment } from "server/features/assignment/run-assignment/runAssignment";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { config } from "shared/config";
import {
  findSettings,
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

  // Acquire the same lock the auto-assign cron uses so a manual run can't overlap a
  // cron run (or another manual run) and corrupt results via the non-atomic save
  const assignmentLastRunResult = await setAssignmentLastRun(
    dayjs().toISOString(),
  );
  if (!assignmentLastRunResult.ok) {
    if (assignmentLastRunResult.error === MongoDbError.SETTINGS_NOT_FOUND) {
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

  const assignResultsResult = await runAssignment({
    assignmentAlgorithm: config.event().assignmentAlgorithm,
    assignmentTime,
  });

  if (assignResultsResult.ok) {
    const assignResults = assignResultsResult.value;

    return {
      message: "Assignment success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      assignmentTime,
    };
  }

  return {
    message: "Assignment failed",
    status: "error",
    errorId: "unknown",
  };
};
