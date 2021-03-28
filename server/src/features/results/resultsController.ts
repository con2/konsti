import { logger } from 'server/utils/logger';
import { Status } from 'shared/typings/api/games';
import { Result } from 'server/typings/result.typings';
import { findResult } from 'server/features/results/resultsService';

interface GetResultsResponse {
  message: string;
  status: Status;
  error?: Error;
  results?: readonly Result[];
  startTime?: string;
}

export const getResults = async (
  startTime: string
): Promise<GetResultsResponse> => {
  logger.info('API call: GET /api/results');

  let results;
  try {
    results = await findResult(startTime);
  } catch (error) {
    logger.error(`Results: ${error}`);
    return {
      message: 'Getting results failed',
      status: 'error',
      error,
    };
  }

  if (!results) {
    return {
      message: 'Getting results success',
      status: 'success',
      results: [],
      startTime: startTime,
    };
  }

  return {
    message: 'Getting results success',
    status: 'success',
    results: results.results,
    startTime: results.startTime,
  };
};
