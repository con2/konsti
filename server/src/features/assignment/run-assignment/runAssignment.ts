import { partition } from "remeda";
import { config } from "shared/config";
import {
  AssignmentAlgorithm,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigTypes";
import { DIRECT_SIGNUP_PRIORITY } from "shared/constants/signups";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { Result, makeSuccessResult } from "shared/utils/result";
import { hasLotteryAlreadyRun } from "shared/utils/signupTimes";
import { getDynamicStartTime } from "server/features/assignment/utils/getDynamicStartTime";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
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
  // signed up afterwards
  const notYetLotteriedProgramItems = startingLotteryProgramItems.filter(
    (programItem) =>
      programItem.lotteryRanForStartTime === undefined &&
      programItem.passedOverForLottery !== true,
  );

  // A start time goes through one lottery, so one program item already carrying the mark closes
  // it for all of them: anything that arrived afterwards - newly imported, or moved onto this
  // slot - joins it on direct sign-up rather than reopening the hour among whoever signed up
  // since. Recorded as passed over so that stays true once their sign-ups change
  const lotteriedHere = startingLotteryProgramItems.some(
    (programItem) =>
      programItem.lotteryRanForStartTime !== undefined &&
      // Marked for a slot it no longer starts at means it was lotteried elsewhere and moved
      // onto this one, which says nothing about whether this start time has had its lottery
      !hasLotteryAlreadyRun(programItem),
  );

  if (
    startingLotteryProgramItems.length > 0 &&
    (lotteriedHere || notYetLotteriedProgramItems.length === 0)
  ) {
    logger.info(
      `Start time ${resolvedAssignmentTime} has already been lotteried, stop`,
    );
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

  // A lottery program item is empty when its lottery runs. One that isn't keeps what it has and
  // stays on direct sign-up, since lotterying the rest would decide a single program item by two
  // different rules. Skipped items are still marked below, so emptying one cannot put it back
  const userSignupsByProgramItemId = new Map(
    directSignupsResult.value.map((directSignup) => [
      directSignup.programItemId,
      directSignup.userSignups,
    ]),
  );
  const [occupiedProgramItems, emptyProgramItems] = partition(
    notYetLotteriedProgramItems,
    (programItem) =>
      (userSignupsByProgramItemId.get(programItem.programItemId) ?? []).length >
      0,
  );

  // Reported apart only to say which way it broke: a lottery priority means an earlier run
  // placed people here and stopped before marking it, a first-come one means the program item
  // is taking direct sign-ups by another route
  const [lotteryPlaced, takingDirectSignups] = partition(
    occupiedProgramItems,
    (programItem) =>
      (userSignupsByProgramItemId.get(programItem.programItemId) ?? []).some(
        (userSignup) => userSignup.priority !== DIRECT_SIGNUP_PRIORITY,
      ),
  );

  if (lotteryPlaced.length > 0) {
    logger.error(
      new Error(
        `Assignment ${resolvedAssignmentTime}: ${lotteryPlaced.length} program items already hold lottery-placed sign-ups, so an earlier run placed attendees there without marking it: ${lotteryPlaced.map((programItem) => programItem.programItemId).join(", ")}`,
      ),
    );
  }

  if (takingDirectSignups.length > 0) {
    logger.error(
      new Error(
        `Assignment ${resolvedAssignmentTime}: ${takingDirectSignups.length} program items already hold first-come-first-served sign-ups, leaving them on direct sign-up instead of lotterying them: ${takingDirectSignups.map((programItem) => programItem.programItemId).join(", ")}`,
      ),
    );
  }

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
    lotteriedProgramItemIds: emptyProgramItems.map(
      (programItem) => programItem.programItemId,
    ),
    // The occupied ones are recorded as passed over rather than lotteried, which is what they
    // were, and what keeps their sign-up open once those sign-ups are cancelled
    passedOverProgramItemIds: occupiedProgramItems.map(
      (programItem) => programItem.programItemId,
    ),
  });
  if (!saveResultsResult.ok) {
    return saveResultsResult;
  }
  // Only the attendees who actually got a spot. Acting on the algorithm's proposal instead
  // would strip the lottery sign-ups of someone a dropped result left with nothing, and those
  // cannot be re-added once the sign-up window has closed
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
      return removeOverlapSignupsResult;
    }
  }

  return makeSuccessResult({ ...assignResults, results: savedResults });
};
