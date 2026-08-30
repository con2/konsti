import { config } from "shared/config";
import {
  AssignmentAlgorithm,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigTypes";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";
import { getDynamicStartTime } from "server/features/assignment/utils/getDynamicStartTime";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { hasStartTimeBeenLotteried } from "server/features/assignment/utils/hasStartTimeBeenLotteried";
import { partitionByHeldSignups } from "server/features/assignment/utils/partitionByHeldSignups";
import { prepareAssignmentParams } from "server/features/assignment/utils/prepareAssignmentParams";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { removeOverlapLotterySignups } from "server/features/assignment/utils/removeOverlapLotterySignups";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { saveResults } from "server/features/assignment/utils/saveResults";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  findProgramItems,
  savePassedOverForLottery,
} from "server/features/program-item/programItemRepository";
import { findUsers } from "server/features/user/userRepository";
import {
  AssignmentResult,
  AssignmentResultStatus,
} from "server/types/resultTypes";
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

  const startingLotteryProgramItems = getStartingProgramItems(
    validLotterySignupProgramItems,
    resolvedAssignmentTime,
  );

  // The lottery for a start time happens once. An item already carrying a mark either had its
  // lottery here, or had it elsewhere and was rescheduled onto this slot - either way its
  // remaining spots go to direct sign-up rather than through a second lottery among whoever
  // signed up afterwards.
  const notYetLotteriedProgramItems = startingLotteryProgramItems.filter(
    (programItem) =>
      programItem.lotteryRanForStartTime === undefined &&
      programItem.passedOverForLottery !== true,
  );

  const lotteriedHere = hasStartTimeBeenLotteried(
    programItems,
    resolvedAssignmentTime,
  );

  if (
    startingLotteryProgramItems.length > 0 &&
    (lotteriedHere || notYetLotteriedProgramItems.length === 0)
  ) {
    logger.info(
      `Start time ${resolvedAssignmentTime} has already been lotteried, stop`,
    );
    // Recorded rather than lotteried: they arrived after the hour was decided, so this is what
    // puts them on direct sign-up and keeps them there once their sign-ups change. The lottery
    // sign-ups they carry are for a lottery that has been run, so nothing removes them.
    const passedOverResult = await savePassedOverForLottery(
      notYetLotteriedProgramItems.map(
        (programItem) => programItem.programItemId,
      ),
    );
    if (!passedOverResult.ok) {
      return passedOverResult;
    }
    return makeSuccessResult({
      results: [],
      message: `${assignmentAlgorithm} Assignment Result - Lottery has already been run for this start time`,
      algorithm: assignmentAlgorithm,
      status: AssignmentResultStatus.ALREADY_LOTTERIED,
    });
  }

  const { emptyProgramItems, occupiedProgramItems } = partitionByHeldSignups(
    notYetLotteriedProgramItems,
    directSignupsResult.value,
    resolvedAssignmentTime,
  );

  const assignResultsResult = runAssignmentAlgorithm(
    assignmentAlgorithm,
    validLotterySignupsUsers,
    emptyProgramItems,
    resolvedAssignmentTime,
    lotteryParticipantDirectSignups,
    programItems,
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
    programItems,
    lotteriedProgramItems: emptyProgramItems,
    // The occupied ones are recorded as passed over rather than lotteried, which is what they
    // were, and what keeps their sign-up open once those sign-ups are cancelled
    passedOverProgramItems: occupiedProgramItems,
  });
  if (!saveResultsResult.ok) {
    return saveResultsResult;
  }
  // Only the attendees who actually got a spot. Acting on the algorithm's proposal instead
  // would strip the lottery sign-ups of someone a dropped result left with nothing, and those
  // cannot be re-added once the sign-up window has closed.
  const savedResults = saveResultsResult.value;

  if (
    savedResults.length > 0 &&
    config.event().removeLotterySignupsStrategy !==
      RemoveLotterySignupsStrategy.NONE
  ) {
    const removeOverlapSignupsResult = await removeOverlapLotterySignups(
      savedResults,
      validLotterySignupProgramItems,
      resolvedAssignmentTime,
    );
    if (!removeOverlapSignupsResult.ok) {
      // The spots are saved and the start time closed by now, so reporting a failure here
      // would call a lottery that finished a failure. It leaves an attendee holding a lottery
      // sign-up for an hour they have already been placed at, which an admin can remove.
      logger.error(
        new Error(
          `Assignment ${resolvedAssignmentTime}: failed to remove overlapping lottery sign-ups: ${removeOverlapSignupsResult.error}`,
        ),
      );
    }
  }

  return makeSuccessResult({ ...assignResults, results: savedResults });
};
