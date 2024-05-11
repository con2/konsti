import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/assignment/runAssignment";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostAssignmentResponse } from "shared/types/api/assignment";
import { ApiError } from "shared/types/api/errors";
import { config } from "shared/config";
import { isSuccessResult, unwrapResult } from "shared/utils/result";

export const storeAssignment = async (
  startTime: string,
): Promise<PostAssignmentResponse | ApiError> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  const assignResultsResult = await runAssignment({
    assignmentStrategy: config.shared().assignmentStrategy,
    startTime,
  });

  if (isSuccessResult(assignResultsResult)) {
    const assignResults = unwrapResult(assignResultsResult);

    return {
      message: "Assignment success",
      status: "success",
      results: assignResults.results,
      resultMessage: assignResults.message,
      startTime,
    };
  }

  return {
    message: `Assignment failed`,
    status: "error",
    errorId: "unknown",
  };
};
