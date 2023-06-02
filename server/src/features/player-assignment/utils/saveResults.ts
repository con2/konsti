import { logger } from "server/utils/logger";
import { saveUserSignupResults } from "server/features/player-assignment/utils/saveUserSignupResults";
import { AssignmentResult } from "shared/typings/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import { Result, isErrorResult, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/typings/api/errors";

interface SaveResultsParams {
  results: readonly AssignmentResult[];
  startingTime: string;
  algorithm: string;
  message: string;
}

export const saveResults = async ({
  results,
  startingTime,
  algorithm,
  message,
}: SaveResultsParams): Promise<Result<void, MongoDbError>> => {
  logger.info(
    `Save all signup results to separate collection for starting time ${startingTime}`
  );
  const saveResultResult = await saveResult(
    results,
    startingTime,
    algorithm,
    message
  );
  if (isErrorResult(saveResultResult)) {
    return saveResultResult;
  }

  logger.info(`Save user signup results for starting time ${startingTime}`);
  const saveUserSignupResultsResult = await saveUserSignupResults(
    startingTime,
    results
  );
  if (isErrorResult(saveUserSignupResultsResult)) {
    return saveUserSignupResultsResult;
  }

  return makeSuccessResult(undefined);
};
