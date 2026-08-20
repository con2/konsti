import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { MongoDbError } from "shared/types/api/errors";
import {
  AssignmentResultGroup,
  UserAssignmentResult,
} from "shared/types/models/result";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  ResultsModel,
  ResultsSchemaDb,
} from "server/features/results/resultsSchema";
import { logger } from "server/utils/logger";

export const removeResults = async (): Promise<Result<void, MongoDbError>> => {
  logger.info("MongoDB: remove ALL results from db");
  try {
    await ResultsModel.deleteMany({});
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error removing ALL results", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

export const saveResult = async (
  signupResultData: readonly UserAssignmentResult[],
  groups: readonly AssignmentResultGroup[],
  assignmentTime: string,
  algorithm: AssignmentAlgorithm,
  message: string,
): Promise<Result<void, MongoDbError>> => {
  try {
    await ResultsModel.replaceOne(
      { assignmentTime },
      { assignmentTime, results: signupResultData, groups, algorithm, message },
      { upsert: true },
    );
    logger.debug(
      `MongoDB: Signup results for assignment time ${assignmentTime} stored to separate collection`,
    );
    return makeSuccessResult();
  } catch (error) {
    logger.error(
      new Error(
        `MongoDB: Error storing signup results for assignment time ${assignmentTime} to separate collection`,
        { cause: error },
      ),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};

interface AssignmentResult {
  results: UserAssignmentResult[];
  groups: AssignmentResultGroup[];
  assignmentTime: string;
  algorithm: string;
  message: string;
}

export const findResults = async (): Promise<
  Result<AssignmentResult[], MongoDbError>
> => {
  try {
    const response = await ResultsModel.find({}).lean();
    logger.debug("MongoDB: Find all results");

    const results = response.flatMap((assignmentResult) => {
      const result = ResultsSchemaDb.safeParse(assignmentResult);
      if (!result.success) {
        logger.error(
          new Error(
            // Logged raw rather than formatted: this document just failed
            // validation, so its assignmentTime may not be a usable date and
            // formatting it would throw, turning one skipped row into a failed
            // query for every result
            `Error validating findResults DB value: assignmentTime: ${JSON.stringify(assignmentResult.assignmentTime)}`,
            { cause: result.error },
          ),
        );
        return [];
      }
      return result.data;
    });

    return makeSuccessResult(results);
  } catch (error) {
    logger.error(
      new Error("MongoDB: Error fetching results", { cause: error }),
    );
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
