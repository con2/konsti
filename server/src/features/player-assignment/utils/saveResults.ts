import { logger } from "server/utils/logger";
import { saveUserSignupResults } from "server/features/player-assignment/utils/saveUserSignupResults";
import { Result } from "shared/typings/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

interface SaveResultsParams {
  results: readonly Result[];
  startingTime: string;
  algorithm: string;
  message: string;
}

export const saveResults = async ({
  results,
  startingTime,
  algorithm,
  message,
}: SaveResultsParams): Promise<AsyncResult<void, MongoDbError>> => {
  logger.info(
    `Save all signup results to separate collection for starting time ${startingTime}`
  );
  const saveResultAsyncResult = await saveResult(
    results,
    startingTime,
    algorithm,
    message
  );
  if (isErrorResult(saveResultAsyncResult)) {
    return saveResultAsyncResult;
  }

  logger.info(`Save user signup results for starting time ${startingTime}`);
  const saveUserSignupResultsAsyncResult = await saveUserSignupResults(
    startingTime,
    results
  );
  if (isErrorResult(saveUserSignupResultsAsyncResult)) {
    return saveUserSignupResultsAsyncResult;
  }

  return makeSuccessResult(undefined);
};
