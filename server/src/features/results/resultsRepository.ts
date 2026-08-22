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

// Usernames have no charset restriction, so the pair is encoded rather than concatenated
// with a separator that a username could itself contain
export const toAttendeeSpotKey = (
  username: string,
  programItemId: string,
): string => JSON.stringify([username, programItemId]);

export const saveResult = async (
  signupResultData: readonly UserAssignmentResult[],
  groups: readonly AssignmentResultGroup[],
  assignmentTime: string,
  algorithm: AssignmentAlgorithm,
  message: string,
  // Every (attendee, program item) pair holding a spot at this start time once this run
  // finished. Stored entries outside it are pruned, so a spot given up between runs, or
  // swapped for a different program item, doesn't linger in the snapshot
  attendeeSpots: ReadonlySet<string>,
): Promise<Result<void, MongoDbError>> => {
  // Matched to the minute like every other start time comparison, so two runs a few
  // seconds apart merge into one document instead of splitting into two
  const assignmentTimeMinute = startOfMinute(new Date(assignmentTime));

  try {
    // A run only reports the attendees it placed itself, so its results are merged into
    // the snapshot for this start time rather than replacing it. Attendees placed by an
    // earlier run are kept out of the run and would otherwise vanish from the history
    const existing = await ResultsModel.findOne({
      assignmentTime: assignmentTimeMinute,
    }).lean();

    let existingResults: readonly UserAssignmentResult[] = [];
    let existingGroups: readonly AssignmentResultGroup[] = [];
    let parsedExistingAlgorithm: string = algorithm;
    let parsedExistingMessage = message;
    if (existing) {
      const parsedExisting = ResultsSchemaDb.safeParse(existing);
      if (!parsedExisting.success) {
        // Overwriting would silently drop every result already recorded for this start
        // time, which is the history the merge exists to keep. Leave the document alone
        logger.error(
          new Error(
            `Error validating existing results for assignment time ${assignmentTime}, not overwriting them`,
            { cause: parsedExisting.error },
          ),
        );
        return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
      }
      existingResults = parsedExisting.data.results;
      existingGroups = parsedExisting.data.groups;
      parsedExistingAlgorithm = parsedExisting.data.algorithm;
      parsedExistingMessage = parsedExisting.data.message;
    }

    if (!existing && signupResultData.length === 0) {
      return makeSuccessResult();
    }

    const newResultUsernames = new Set(
      signupResultData.map((result) => result.username),
    );
    const keptResults = existingResults.filter(
      (result) =>
        !newResultUsernames.has(result.username) &&
        attendeeSpots.has(
          toAttendeeSpotKey(
            result.username,
            result.assignmentSignup.programItemId,
          ),
        ),
    );
    const mergedResults = [...keptResults, ...signupResultData];

    // A group's snapshot belongs to the run that placed it. Only groups this run actually
    // placed replace their stored entry, and a stored entry is kept only while at least
    // one of its attendees is still in the results
    const mergedResultUsernames = new Set(
      mergedResults.map((result) => result.username),
    );
    const placedGroupCodes = new Set(
      groups
        .filter((group) =>
          group.groupMembers.some((groupMember) =>
            newResultUsernames.has(groupMember),
          ),
        )
        .map((group) => group.groupCode),
    );
    const mergedGroups = [
      ...existingGroups.filter(
        (group) =>
          !placedGroupCodes.has(group.groupCode) &&
          group.groupMembers.some((groupMember) =>
            mergedResultUsernames.has(groupMember),
          ),
      ),
      ...groups.filter((group) => placedGroupCodes.has(group.groupCode)),
    ];

    // algorithm and message describe the run that just finished, but the stored results can
    // span several, so say so rather than letting one run's summary stand for all. A run that
    // placed nobody describes nothing: it keeps whichever run's summary is already stored, or
    // its own when there is none, so an empty re-run can't restamp a full run's results
    const placedNobody = signupResultData.length === 0;
    const storedAlgorithm =
      placedNobody && existing ? parsedExistingAlgorithm : algorithm;
    const mergedMessage =
      placedNobody && existing
        ? parsedExistingMessage
        : mergedResults.length === signupResultData.length
          ? message
          : `${message} (latest run; snapshot holds ${mergedResults.length} attendees from more than one run)`;

    await ResultsModel.replaceOne(
      { assignmentTime: assignmentTimeMinute },
      {
        assignmentTime: assignmentTimeMinute,
        results: mergedResults,
        groups: mergedGroups,
        algorithm: storedAlgorithm,
        message: mergedMessage,
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
