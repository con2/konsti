import { logger } from "server/utils/logger";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostPlayerAssignmentResponse } from "shared/typings/api/assignment";
import { ApiError } from "shared/typings/api/errors";
import { sharedConfig } from "shared/config/sharedConfig";

// Assign players to games
export const storeAssignment = async (
  startingTime: string
): Promise<PostPlayerAssignmentResponse | ApiError> => {
  logger.info(`API call: POST ${ApiEndpoint.ASSIGNMENT}`);

  let assignResults;
  try {
    assignResults = await runAssignment(
      startingTime,
      sharedConfig.assignmentStrategy
    );
  } catch (error) {
    logger.error(`Player assign error: ${error}`);
    return {
      message: `Players assign failed`,
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Players assign success",
    status: "success",
    results: assignResults.results,
    resultMessage: assignResults.message,
    startTime: startingTime,
  };
};
