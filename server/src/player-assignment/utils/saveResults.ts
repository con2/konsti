import { logger } from 'server/utils/logger';
import { saveUserSignupResults } from 'server/player-assignment/utils/saveUserSignupResults';
import { Result } from 'server/typings/result.typings';
import { saveResult } from 'server/db/results/resultsService';

export const saveResults = async (
  results: readonly Result[],
  startingTime: string,
  algorithm: string,
  message: string
): Promise<void> => {
  try {
    logger.info(
      `Save all signup results to separate collection for starting time ${startingTime}`
    );
    await saveResult(results, startingTime, algorithm, message);
  } catch (error) {
    throw new Error(`No assign results: saveResult error: ${error}`);
  }

  try {
    logger.info(`Save user signup results for starting time ${startingTime}`);
    await saveUserSignupResults(startingTime, results);
  } catch (error) {
    throw new Error(`MongoDB: Error saving user signup results - ${error}`);
  }
};
