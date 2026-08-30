import { startOfMinute } from "date-fns";
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

// One document per start time, and the collection is dumped and kept once the event is over,
// so it is the only lasting account of what the lottery did. A start time is lotteried once,
// but an attempt that saved its spots and failed before marking them can be run again - and
// the second attempt skips the program items the first one filled, so replacing the document
// would drop the first attempt's placements from the record for good.
export const saveResult = async (
  signupResultData: readonly UserAssignmentResult[],
  groups: readonly AssignmentResultGroup[],
  assignmentTime: string,
  algorithm: AssignmentAlgorithm,
  message: string,
): Promise<Result<void, MongoDbError>> => {
  // Matched to the minute like every other start time comparison, so the document is found
  // again by a lookup whose time carries seconds
  const assignmentTimeMinute = startOfMinute(new Date(assignmentTime));

  try {
    const previous = await ResultsModel.findOne({
      assignmentTime: assignmentTimeMinute,
    }).lean();

    // An attendee holds one spot per start time, so a placement written again replaces the
    // earlier record of it rather than joining it. Only the placements merge: the algorithm,
    // the message and the group snapshot describe the attempt that wrote them (choice 9).
    const placedNow = new Set(
      signupResultData.map((result) => result.username),
    );
    const previousResults = (previous?.results ?? []).filter(
      (result) => !placedNow.has(result.username),
    );

    await ResultsModel.replaceOne(
      { assignmentTime: assignmentTimeMinute },
      {
        assignmentTime: assignmentTimeMinute,
        results: [...previousResults, ...signupResultData],
        groups,
        algorithm,
        message,
      },
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
