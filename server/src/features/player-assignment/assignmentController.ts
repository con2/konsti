import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostPlayerAssignmentResponse } from "shared/typings/api/assignment";
import { ApiError } from "shared/typings/api/errors";
import { config } from "shared/config";
import { isSuccessResult, unwrapResult } from "shared/utils/result";

// Assign players to games
export const storeAssignment = async (
  startTime: string,
): Promise<PostPlayerAssignmentResponse | ApiError> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  const assignResultsResult = await runAssignment({
    assignmentStrategy: config.shared().assignmentStrategy,
    startTime,
  });

  if (isSuccessResult(assignResultsResult)) {
    const assignResults = unwrapResult(assignResultsResult);

    return {
      message: "Players assign success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      startTime,
    };
  }

  return {
    message: `Players assign failed`,
    status: "error",
    errorId: "unknown",
  };
};
