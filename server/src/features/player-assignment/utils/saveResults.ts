import { logger } from "server/utils/logger";
import { saveUserSignupResults } from "server/features/player-assignment/utils/saveUserSignupResults";
import { AssignmentResult } from "shared/types/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import { Result, isErrorResult, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

interface SaveResultsParams {
  results: readonly AssignmentResult[];
  startTime: string;
  algorithm: string;
  message: string;
}

export const saveResults = async ({
  results,
  startTime,
  algorithm,
  message,
}: SaveResultsParams): Promise<Result<void, MongoDbError>> => {
  logger.info(
    `Save all signup results to separate collection for start time ${startTime}`,
  );
  const saveResultResult = await saveResult(
    results,
    startTime,
    algorithm,
    message,
  );
  if (isErrorResult(saveResultResult)) {
    return saveResultResult;
  }

  logger.info(`Save user signup results for start time ${startTime}`);
  const saveUserSignupResultsResult = await saveUserSignupResults(
    startTime,
    results,
  );
  if (isErrorResult(saveUserSignupResultsResult)) {
    return saveUserSignupResultsResult;
  }

  return makeSuccessResult(undefined);
};
