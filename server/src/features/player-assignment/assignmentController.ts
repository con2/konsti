import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostPlayerAssignmentResponse } from "shared/typings/api/assignment";
import { ApiError } from "shared/typings/api/errors";
import { sharedConfig } from "shared/config/sharedConfig";
import { isSuccessResult, unwrapResult } from "shared/utils/asyncResult";

// Assign players to games
export const storeAssignment = async (
  startingTime: string
): Promise<PostPlayerAssignmentResponse | ApiError> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  const assignResultsAsyncResult = await runAssignment({
    assignmentStrategy: sharedConfig.assignmentStrategy,
    startingTime,
  });

  if (isSuccessResult(assignResultsAsyncResult)) {
    const assignResults = unwrapResult(assignResultsAsyncResult);

    return {
      message: "Players assign success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      startTime: startingTime,
    };
  }

  return {
    message: `Players assign failed`,
    status: "error",
    errorId: "unknown",
  };
};
