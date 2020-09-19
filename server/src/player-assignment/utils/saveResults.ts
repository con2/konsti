import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { saveUserSignupResults } from 'player-assignment/utils/saveUserSignupResults';
import { Result } from 'typings/result.typings';

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
    await db.results.saveResult(results, startingTime, algorithm, message);
  } catch (error) {
    throw new Error(`No assign results: db.results.saveResult error: ${error}`);
  }

  try {
    logger.info(`Save user signup results for starting time ${startingTime}`);
    await saveUserSignupResults(startingTime, results);
  } catch (error) {
    throw new Error(`MongoDB: Error saving user signup results - ${error}`);
  }
};
