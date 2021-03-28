import { logger } from 'server/utils/logger';
import { removeOverlapSignups } from 'server/features/player-assignment/utils/removeOverlapSignups';
import { saveResults } from 'server/features/player-assignment/utils/saveResults';
import { runAssignment } from 'server/features/player-assignment/runAssignment';
import { config } from 'server/config';
import { Status } from 'shared/typings/api/games';
import { Result } from 'server/typings/result.typings';

interface PostAssignmentResponse {
  message: string;
  status: Status;
  error?: Error;
  results?: readonly Result[];
  resultMessage?: string;
  startTime?: string;
}

// Assign players to games
export const postAssignment = async (
  startingTime: string
): Promise<PostAssignmentResponse> => {
  logger.info('API call: POST /api/assignment');

  if (!startingTime) {
    return {
      message: 'Invalid starting time',
      status: 'error',
    };
  }

  let assignResults;
  try {
    assignResults = await runAssignment(startingTime);
  } catch (error) {
    logger.error(`Player assign error: ${error}`);
    return {
      message: 'Players assign failure',
      status: 'error',
    };
  }

  if (!assignResults || !assignResults.results) {
    return {
      message: 'Players assign failure',
      status: 'error',
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
      message: 'Players assign failure',
      status: 'error',
      error,
    };
  }

  // Remove overlapping signups
  if (config.enableRemoveOverlapSignups) {
    try {
      logger.info('Remove overlapping signups');
      await removeOverlapSignups(assignResults.results);
    } catch (error) {
      logger.error(`removeOverlapSignups error: ${error}`);
      return {
        message: 'Players assign failure',
        status: 'error',
        error,
      };
    }
  }

  return {
    message: 'Players assign success',
    status: 'success',
    results: assignResults.results,
    resultMessage: assignResults.message,
    startTime: startingTime,
  };
};
