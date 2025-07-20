import { logger } from "server/utils/logger";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import { UserAssignmentResult } from "shared/types/models/result";
import { saveResult } from "server/features/results/resultsRepository";
import { Result, isErrorResult, makeSuccessResult } from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";

interface SaveResultsParams {
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
  algorithm: AssignmentAlgorithm;
  message: string;
  users: User[];
  programItems: ProgramItem[];
}

export const saveResults = async ({
  results,
  assignmentTime,
  algorithm,
  message,
  users,
  programItems,
}: SaveResultsParams): Promise<Result<void, MongoDbError>> => {
  if (results.length > 0) {
    logger.info(
      `Save all signup results to separate collection for assignment time ${assignmentTime}`,
    );

    const saveResultResult = await saveResult(
      results,
      assignmentTime,
      algorithm,
      message,
    );
    if (isErrorResult(saveResultResult)) {
      return saveResultResult;
    }
  } else {
    logger.info(
      `No results, skip saving signup results to separate collection for assignment time ${assignmentTime}`,
    );
  }

  logger.info(`Save user signup results for assignment time ${assignmentTime}`);
  const saveUserSignupResultsResult = await saveUserSignupResults({
    assignmentTime,
    results,
    users,
    programItems,
  });
  if (isErrorResult(saveUserSignupResultsResult)) {
    return saveUserSignupResultsResult;
  }

  return makeSuccessResult();
};
