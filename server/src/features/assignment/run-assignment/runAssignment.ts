import { config } from "shared/config";
import {
  AssignmentAlgorithm,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigTypes";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getDynamicStartTime } from "server/features/assignment/utils/getDynamicStartTime";
import { getSettledAttendeeUsernames } from "server/features/assignment/utils/getSettledAttendeeUsernames";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { prepareAssignmentParams } from "server/features/assignment/utils/prepareAssignmentParams";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { removeOverlapLotterySignups } from "server/features/assignment/utils/removeOverlapLotterySignups";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { saveResults } from "server/features/assignment/utils/saveResults";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { findUsers } from "server/features/user/userRepository";
import { AssignmentResult } from "server/types/resultTypes";
import { logger } from "server/utils/logger";
import { sleep } from "server/utils/sleep";

interface RunAssignmentParams {
  assignmentAlgorithm: AssignmentAlgorithm;
  assignmentTime: string | null;
  assignmentDelay?: number;
}

export const runAssignment = async ({
  assignmentAlgorithm,
  assignmentTime,
  assignmentDelay = 0,
}: RunAssignmentParams): Promise<
  Result<AssignmentResult, MongoDbError | AssignmentError>
> => {
  // If assignmentTime is null, use dynamic time
  const assignmentTimeResult = assignmentTime
    ? makeSuccessResult(assignmentTime)
    : await getDynamicStartTime();
  if (!assignmentTimeResult.ok) {
    return assignmentTimeResult;
  }
  const resolvedAssignmentTime = assignmentTimeResult.value;

  if (assignmentDelay) {
    logger.info(`Wait ${assignmentDelay / 1000}s for final requests`);
    await sleep(assignmentDelay);
    logger.info("Waiting done, start assignment");
  }

  logger.info(
    `Assigning users for program items starting at ${resolvedAssignmentTime}`,
  );

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return programItemsResult;
  }
  const programItems = programItemsResult.value;

  const removeCancelledDeletedProgramItemsResult =
    await removeCancelledDeletedProgramItemsFromUsers({
      programItems,
      currentProgramItems: [],
      notifyAffectedDirectSignups: [],
      notify: false,
    });
  if (!removeCancelledDeletedProgramItemsResult.ok) {
    return removeCancelledDeletedProgramItemsResult;
  }

  const usersResult = await findUsers();
  if (!usersResult.ok) {
    return usersResult;
  }

  const directSignupsResult = await findDirectSignups();
  if (!directSignupsResult.ok) {
    return directSignupsResult;
  }

  const {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryParticipantDirectSignups,
  } = prepareAssignmentParams(
    usersResult.value,
    programItems,
    directSignupsResult.value,
  );

  // Attendees who already hold a spot at this start time. Derived once and handed to both
  // the algorithm, which leaves them out of the run, and the notification step, which uses
  // it to tell an attendee sitting the run out apart from one the lottery could not place.
  // Read from every program item and every direct sign-up, not just the ones the lottery
  // allocates: holding a spot is what settles an attendee, whatever kind of spot it is
  const settledAttendeeUsernames = getSettledAttendeeUsernames(
    getStartingProgramItems(programItems, resolvedAssignmentTime),
    directSignupsResult.value,
  );

  const assignResultsResult = runAssignmentAlgorithm(
    assignmentAlgorithm,
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    resolvedAssignmentTime,
    lotteryParticipantDirectSignups,
    settledAttendeeUsernames,
  );
  if (!assignResultsResult.ok) {
    return assignResultsResult;
  }
  const assignResults = assignResultsResult.value;

  const saveResultsResult = await saveResults({
    results: assignResults.results,
    assignmentTime: resolvedAssignmentTime,
    algorithm: assignResults.algorithm,
    message: assignResults.message,
    users: validLotterySignupsUsers,
    settledAttendeeUsernames,
    programItems,
  });
  if (!saveResultsResult.ok) {
    return saveResultsResult;
  }

  if (
    assignResults.results.length > 0 &&
    config.event().removeLotterySignupsStrategy !==
      RemoveLotterySignupsStrategy.NONE
  ) {
    const removeOverlapSignupsResult = await removeOverlapLotterySignups(
      assignResults.results,
      validLotterySignupProgramItems,
      resolvedAssignmentTime,
    );
    if (!removeOverlapSignupsResult.ok) {
      return removeOverlapSignupsResult;
    }
  }

  return makeSuccessResult(assignResults);
};
