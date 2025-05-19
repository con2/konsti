import { logger } from "server/utils/logger";
import { ResultsModel } from "server/features/results/resultsSchema";
import { UserAssignmentResult } from "shared/types/models/result";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";

export const removeResults = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL results from db");
  try {
    await ResultsModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Error removing ALL results: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveResult = async (
  signupResultData: readonly UserAssignmentResult[],
  assignmentTime: string,
  algorithm: AssignmentAlgorithm,
  message: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    await ResultsModel.replaceOne(
      { assignmentTime },
      { assignmentTime, results: signupResultData, algorithm, message },
      { upsert: true },
    );
    logger.debug(
      `MongoDB: Signup results for assignment time ${assignmentTime} stored to separate collection`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup results for assignment time ${assignmentTime} to separate collection: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
