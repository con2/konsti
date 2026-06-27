import dayjs from "dayjs";
import { logger } from "server/utils/logger";
import {
  ResultsModel,
  ResultsSchemaDb,
} from "server/features/results/resultsSchema";
import {
  AssignmentResultGroup,
  UserAssignmentResult,
} from "shared/types/models/result";
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
            `Error validating findResults DB value: assignmentTime: ${dayjs(assignmentResult.assignmentTime).toISOString()}, ${JSON.stringify(result.error)}`,
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
