import { logger } from "server/utils/logger";
import { ResultsModel } from "server/features/results/resultsSchema";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { UserAssignmentResult } from "shared/types/models/result";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";

export const removeResults = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL results from db");
  try {
    await ResultsModel.deleteMany({});
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error("MongoDB: Error removing ALL results: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveResult = async (
  signupResultData: readonly UserAssignmentResult[],
  startTime: string,
  algorithm: AssignmentAlgorithm,
  message: string,
): Promise<Result<void, MongoDbError>> => {
  const programItemsResult = await findProgramItems();

  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }

  const programItems = unwrapResult(programItemsResult);
  const results = signupResultData.reduce<UserAssignmentResult[]>(
    (acc, result) => {
      const programItemDocInDb = programItems.find(
        (programItem) =>
          programItem.programItemId === result.directSignup.programItemId,
      );

      if (programItemDocInDb?._id) {
        acc.push({
          username: result.username,
          directSignup: {
            programItemId: programItemDocInDb.programItemId,
            priority: result.directSignup.priority,
            time: result.directSignup.time,
            message: "",
          },
        });
      }
      return acc;
    },
    [],
  );

  try {
    await ResultsModel.replaceOne(
      { startTime },
      { startTime, results, algorithm, message },
      { upsert: true },
    );
    logger.debug(
      `MongoDB: Signup results for start time ${startTime} stored to separate collection`,
    );
    return makeSuccessResult(undefined);
  } catch (error) {
    logger.error(
      `MongoDB: Error storing signup results for start time ${startTime} to separate collection: %s`,
      error,
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
