import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getAssignmentResultGroups } from "server/features/assignment/utils/getAssignmentResultGroups";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import { saveResult } from "server/features/results/resultsRepository";
import { logger } from "server/utils/logger";

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

    // Snapshot the groups as they were when this lottery ran
    const groups = getAssignmentResultGroups(
      users,
      programItems,
      assignmentTime,
    );

    const saveResultResult = await saveResult(
      results,
      groups,
      assignmentTime,
      algorithm,
      message,
    );
    if (!saveResultResult.ok) {
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
  if (!saveUserSignupResultsResult.ok) {
    return saveUserSignupResultsResult;
  }

  return makeSuccessResult();
};
