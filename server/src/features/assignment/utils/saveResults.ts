import { logger } from "server/utils/logger";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import { Result, isErrorResult, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";

interface SaveResultsParams {
  results: readonly UserAssignmentResult[];
  startTime: string;
  algorithm: string;
  message: string;
  users: User[];
  programItems: ProgramItem[];
}

export const saveResults = async ({
  results,
  startTime,
  algorithm,
  message,
  users,
  programItems,
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
  const saveUserSignupResultsResult = await saveUserSignupResults({
    startTime,
    results,
    users,
    programItems,
  });
  if (isErrorResult(saveUserSignupResultsResult)) {
    return saveUserSignupResultsResult;
  }

  return makeSuccessResult(undefined);
};
