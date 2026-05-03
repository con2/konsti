import { logger } from "server/utils/logger";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { removeCancelledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { AssignmentResult } from "server/types/resultTypes";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { config } from "shared/config";
import { removeOverlapLotterySignups } from "server/features/assignment/utils/removeOverlapLotterySignups";
import { saveResults } from "server/features/assignment/utils/saveResults";
import { getDynamicStartTime } from "server/features/assignment/utils/getDynamicStartTime";
import { sleep } from "server/utils/sleep";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { Result, makeSuccessResult } from "shared/utils/result";
import {
  AssignmentError,
  MongoDbError,
  QueueError,
} from "shared/types/api/errors";
import { prepareAssignmentParams } from "server/features/assignment/utils/prepareAssignmentParams";

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
  Result<AssignmentResult, MongoDbError | AssignmentError | QueueError>
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

  const assignResultsResult = runAssignmentAlgorithm(
    assignmentAlgorithm,
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    resolvedAssignmentTime,
    lotteryParticipantDirectSignups,
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
  });
  if (!saveResultsResult.ok) {
    return saveResultsResult;
  }

  if (
    assignResults.results.length > 0 &&
    (config.event().enableRemoveOverlapSignups ||
      config.event().enableRemoveAllUpcomingSignups)
  ) {
    logger.info("Remove overlapping signups");
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
