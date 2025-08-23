import { logger } from "server/utils/logger";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { removeCanceledDeletedProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
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
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
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
  Result<AssignmentResult, MongoDbError | AssignmentError>
> => {
  // If assignmentTime is null, use dynamic time
  const assignmentTimeResult = assignmentTime
    ? makeSuccessResult(assignmentTime)
    : await getDynamicStartTime();
  if (isErrorResult(assignmentTimeResult)) {
    return assignmentTimeResult;
  }
  const resolvedAssignmentTime = unwrapResult(assignmentTimeResult);

  if (assignmentDelay) {
    logger.info(`Wait ${assignmentDelay / 1000}s for final requests`);
    await sleep(assignmentDelay);
    logger.info("Waiting done, start assignment");
  }

  logger.info(
    `Assigning users for program items starting at ${resolvedAssignmentTime.toString()}`,
  );

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const removeCanceledDeletedProgramItemsResult =
    await removeCanceledDeletedProgramItemsFromUsers({
      programItems,
      notifyAffectedDirectSignups: [],
      notify: false,
    });
  if (isErrorResult(removeCanceledDeletedProgramItemsResult)) {
    return removeCanceledDeletedProgramItemsResult;
  }

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const directSignupsResult = await findDirectSignups();
  if (isErrorResult(directSignupsResult)) {
    return directSignupsResult;
  }
  const directSignups = unwrapResult(directSignupsResult);

  const {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryParticipantDirectSignups,
  } = prepareAssignmentParams(users, programItems, directSignups);

  const assignResultsResult = runAssignmentAlgorithm(
    assignmentAlgorithm,
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    resolvedAssignmentTime,
    lotteryParticipantDirectSignups,
  );
  if (isErrorResult(assignResultsResult)) {
    return assignResultsResult;
  }
  const assignResults = unwrapResult(assignResultsResult);

  const saveResultsResult = await saveResults({
    results: assignResults.results,
    assignmentTime: resolvedAssignmentTime,
    algorithm: assignResults.algorithm,
    message: assignResults.message,
    users: validLotterySignupsUsers,
    programItems,
  });
  if (isErrorResult(saveResultsResult)) {
    return saveResultsResult;
  }

  if (
    assignResults.results.length > 0 &&
    config.event().enableRemoveOverlapSignups
  ) {
    logger.info("Remove overlapping signups");
    const removeOverlapSignupsResult = await removeOverlapLotterySignups(
      assignResults.results,
      validLotterySignupProgramItems,
    );
    if (isErrorResult(removeOverlapSignupsResult)) {
      return removeOverlapSignupsResult;
    }
  }

  return makeSuccessResult(assignResults);
};
