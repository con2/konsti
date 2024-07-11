import { logger } from "server/utils/logger";
import { runAssignmentStrategy } from "server/features/assignment/utils/runAssignmentStrategy";
import { removeInvalidProgramItemsFromUsers } from "server/features/assignment/utils/removeInvalidProgramItemsFromUsers";
import { AssignmentResult } from "server/types/resultTypes";
import { findUsers } from "server/features/user/userRepository";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { config } from "shared/config";
import { removeOverlapSignups } from "server/features/assignment/utils/removeOverlapSignups";
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

interface RunAssignmentParams {
  assignmentStrategy: AssignmentStrategy;
  startTime?: string;
  useDynamicStartTime?: boolean;
  assignmentDelay?: number;
}

export const runAssignment = async ({
  assignmentStrategy,
  startTime,
  useDynamicStartTime = false,
  assignmentDelay = 0,
}: RunAssignmentParams): Promise<
  Result<AssignmentResult, MongoDbError | AssignmentError>
> => {
  const assignmentTimeResult = useDynamicStartTime
    ? await getDynamicStartTime()
    : makeSuccessResult(startTime);
  if (isErrorResult(assignmentTimeResult)) {
    return assignmentTimeResult;
  }
  const assignmentTime = unwrapResult(assignmentTimeResult);

  if (!assignmentTime) {
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  if (assignmentDelay) {
    logger.info(`Wait ${assignmentDelay / 1000}s for final requests`);
    await sleep(assignmentDelay);
    logger.info("Waiting done, start assignment");
  }

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

  const { directSignupAlwaysOpenIds, twoPhaseSignupProgramTypes } =
    config.shared();

  // Remove invalid lottery signups from users
  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  const validLotterySignupsUsers = users.map((user) => {
    const matchingLotterySignups = user.lotterySignups.filter(
      (lotterySignup) =>
        twoPhaseSignupProgramTypes.includes(
          lotterySignup.programItem.programType,
        ) &&
        !directSignupAlwaysOpenIds.includes(
          lotterySignup.programItem.programItemId,
        ),
    );

    return { ...user, lotterySignups: matchingLotterySignups };
  });

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    return programItemsResult;
  }
  const programItems = unwrapResult(programItemsResult);

  // Only include "twoPhaseSignupProgramTypes" and don't include "directSignupAlwaysOpen" program items
  const validLotterySignupProgramItems = programItems.filter(
    (programItem) =>
      twoPhaseSignupProgramTypes.includes(programItem.programType) &&
      !directSignupAlwaysOpenIds.includes(programItem.programItemId),
  );

  const directSignupsResult = await findDirectSignups();
  if (isErrorResult(directSignupsResult)) {
    return directSignupsResult;
  }
  const directSignups = unwrapResult(directSignupsResult);

  const assignResultsResult = runAssignmentStrategy(
    assignmentStrategy,
    validLotterySignupsUsers,
    validLotterySignupProgramItems,
    assignmentTime,
    directSignups,
  );
  if (isErrorResult(assignResultsResult)) {
    return assignResultsResult;
  }
  const assignResults = unwrapResult(assignResultsResult);

  if (assignResults.results.length === 0) {
    logger.warn(
      `No assign results for start time ${assignmentTime}: ${JSON.stringify(
        assignResults,
      )}`,
    );
    return makeSuccessResult(assignResults);
  }

  const saveResultsResult = await saveResults({
    results: assignResults.results,
    startTime: assignmentTime,
    algorithm: assignResults.algorithm,
    message: assignResults.message,
    users: validLotterySignupsUsers,
    programItems: validLotterySignupProgramItems,
  });
  if (isErrorResult(saveResultsResult)) {
    return saveResultsResult;
  }

  if (config.server().enableRemoveOverlapSignups) {
    logger.info("Remove overlapping signups");
    const removeOverlapSignupsResult = await removeOverlapSignups(
      assignResults.results,
    );
    if (isErrorResult(removeOverlapSignupsResult)) {
      return removeOverlapSignupsResult;
    }
  }

  return makeSuccessResult(assignResults);
};
