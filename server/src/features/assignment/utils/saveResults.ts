import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { MongoDbError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { UserAssignmentResult } from "shared/types/models/result";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getAssignmentResultGroups } from "server/features/assignment/utils/getAssignmentResultGroups";
import { saveUserSignupResults } from "server/features/assignment/utils/saveUserSignupResults";
import { findDirectSignupsByStartTime } from "server/features/direct-signup/directSignupRepository";
import {
  saveResult,
  toAttendeeSpotKey,
} from "server/features/results/resultsRepository";
import { logger } from "server/utils/logger";

interface SaveResultsParams {
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
  algorithm: AssignmentAlgorithm;
  message: string;
  users: User[];
  settledAttendeeUsernames: ReadonlySet<string>;
  programItems: ProgramItem[];
}

export const saveResults = async ({
  results,
  assignmentTime,
  algorithm,
  message,
  users,
  settledAttendeeUsernames,
  programItems,
}: SaveResultsParams): Promise<Result<void, MongoDbError>> => {
  logger.info(`Save user signup results for assignment time ${assignmentTime}`);
  const saveUserSignupResultsResult = await saveUserSignupResults({
    assignmentTime,
    results,
    users,
    settledAttendeeUsernames,
    programItems,
  });
  if (!saveUserSignupResultsResult.ok) {
    return saveUserSignupResultsResult;
  }

  // The stored snapshot is record-keeping, written after the spots it describes. Failing
  // here must not fail the run, whose sign-ups and notifications are already saved.
  // Written from the results that landed, not the ones the algorithm produced
  await storeResultsSnapshot({
    results: saveUserSignupResultsResult.value,
    assignmentTime,
    algorithm,
    message,
    users,
    programItems,
  });

  return makeSuccessResult();
};

interface StoreResultsSnapshotParams {
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
  algorithm: AssignmentAlgorithm;
  message: string;
  users: User[];
  programItems: ProgramItem[];
}

const storeResultsSnapshot = async ({
  results,
  assignmentTime,
  algorithm,
  message,
  users,
  programItems,
}: StoreResultsSnapshotParams): Promise<void> => {
  logger.info(
    `Save all signup results to separate collection for assignment time ${assignmentTime}`,
  );

  // Read back who holds a spot now that this run's sign-ups are written. A run only
  // reports the attendees it placed itself, so the stored snapshot is merged rather than
  // replaced, and this is what tells it which of the entries already there are still real
  const directSignupsResult = await findDirectSignupsByStartTime(
    assignmentTime,
    programItems,
  );
  if (!directSignupsResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to read current sign-ups, skip storing the results snapshot`,
      ),
    );
    return;
  }

  const attendeeSpots = new Set(
    directSignupsResult.value.map((signup) =>
      toAttendeeSpotKey(signup.username, signup.programItemId),
    ),
  );

  // Snapshot the groups as they were when this lottery ran
  const groups = getAssignmentResultGroups(users, programItems, assignmentTime);

  const saveResultResult = await saveResult(
    results,
    groups,
    assignmentTime,
    algorithm,
    message,
    attendeeSpots,
  );
  if (!saveResultResult.ok) {
    logger.error(
      new Error(
        `Assignment ${assignmentTime}: failed to store the results snapshot: ${saveResultResult.error}`,
      ),
    );
  }
};
