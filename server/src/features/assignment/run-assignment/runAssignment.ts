import { logger } from "server/utils/logger";
import { runAssignmentAlgorithm } from "server/features/assignment/utils/runAssignmentAlgorithm";
import { removeInvalidProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
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
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError, MongoDbError } from "shared/types/api/errors";
import { prepareAssignmentParams } from "server/features/assignment/utils/prepareAssignmentParams";

interface RunAssignmentParams {
  assignmentAlgorithm: AssignmentAlgorithm;
  assignmentTime?: string;
  useDynamicStartTime?: boolean;
  assignmentDelay?: number;
}

export const runAssignment = async ({
  assignmentAlgorithm,
  assignmentTime,
  useDynamicStartTime = false,
  assignmentDelay = 0,
}: RunAssignmentParams): Promise<
  Result<AssignmentResult, MongoDbError | AssignmentError>
> => {
  const assignmentTimeResult = useDynamicStartTime
    ? await getDynamicStartTime()
    : makeSuccessResult(assignmentTime);
  if (isErrorResult(assignmentTimeResult)) {
    return assignmentTimeResult;
  }
  const resolvedAssignmentTime = unwrapResult(assignmentTimeResult);

  if (!resolvedAssignmentTime) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (assignmentDelay) {
    logger.info(`Wait ${assignmentDelay / 1000}s for final requests`);
    await sleep(assignmentDelay);
    logger.info("Waiting done, start assignment");
  }

  logger.info(
    `Assigning users for program items starting at ${resolvedAssignmentTime.toString()}`,
  );

  const removeInvalidProgramItemsResult =
    await removeInvalidProgramItemsFromUsers();
  if (isErrorResult(removeInvalidProgramItemsResult)) {
    return removeInvalidProgramItemsResult;
  }

  const usersResult = await findUsers();
  if (isErrorResult(usersResult)) {
    return usersResult;
  }
  const users = unwrapResult(usersResult);

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  const directSignupsResult = await findDirectSignups();
  if (isErrorResult(directSignupsResult)) {
    return directSignupsResult;
  }
  const directSignups = unwrapResult(directSignupsResult);

  const {
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    lotteryValidDirectSignups,
  } = prepareAssignmentParams(users, programItems, directSignups);

  const assignResultsResult = runAssignmentAlgorithm(
    assignmentAlgorithm,
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    resolvedAssignmentTime,
    lotteryValidDirectSignups,
  );
  if (isErrorResult(assignResultsResult)) {
    return assignResultsResult;
  }
  const assignResults = unwrapResult(assignResultsResult);

  if (assignResults.results.length === 0) {
    logger.warn(
      `No assign results for start time ${resolvedAssignmentTime}: ${JSON.stringify(
        assignResults,
      )}`,
    );
    return makeSuccessResult(assignResults);
  }

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

  if (config.event().enableRemoveOverlapSignups) {
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
