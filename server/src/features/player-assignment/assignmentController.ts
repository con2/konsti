import { logger } from "server/utils/logger";
import { removeOverlapSignups } from "server/features/player-assignment/utils/removeOverlapSignups";
import { saveResults } from "server/features/player-assignment/utils/saveResults";
import { runAssignment } from "server/features/player-assignment/runAssignment";
import { config } from "server/config";
import { ASSIGNMENT_ENDPOINT } from "shared/constants/apiEndpoints";
import { PostPlayerAssignmentResponse } from "shared/typings/api/assignment";
import { ApiError } from "shared/typings/api/errors";
import { sharedConfig } from "shared/config/sharedConfig";

// Assign players to games
export const storeAssignment = async (
  startingTime: string
): Promise<PostPlayerAssignmentResponse | ApiError> => {
  logger.info(`API call: POST ${ASSIGNMENT_ENDPOINT}`);

  if (!startingTime) {
    return {
      message: "Invalid starting time",
      status: "error",
      code: 0,
    };
  }

  let assignResults;
  try {
    assignResults = await runAssignment(
      startingTime,
      sharedConfig.assignmentStrategy
    );
  } catch (error) {
    logger.error(`Player assign error: ${error}`);
    return {
      message: "Players assign failure",
      status: "error",
      code: 0,
    };
  }

  if (!assignResults || !assignResults.results) {
    return {
      message: "Players assign failure",
      status: "error",
      code: 0,
    };
  }

  try {
    await saveResults(
      assignResults.results,
      startingTime,
      assignResults.algorithm,
      assignResults.message
    );
  } catch (error) {
    logger.error(`saveResult error: ${error}`);
    return {
      message: "Players assign failure",
      status: "error",
      code: 0,
    };
  }

  // Remove overlapping signups
  if (config.enableRemoveOverlapSignups) {
    try {
      logger.info("Remove overlapping signups");
      await removeOverlapSignups(assignResults.results);
    } catch (error) {
      logger.error(`removeOverlapSignups error: ${error}`);
      return {
        message: "Players assign failure",
        status: "error",
        code: 0,
      };
    }
  }

  return {
    message: "Players assign success",
    status: "success",
    results: assignResults.results,
    resultMessage: assignResults.message,
    startTime: startingTime,
  };
};
