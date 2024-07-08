import { logger } from "server/utils/logger";
import { padgAssignment } from "server/features/assignment/padg/padgAssignment";
import { randomAssignment } from "server/features/assignment/random/randomAssignment";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  AssignmentResult,
} from "server/types/resultTypes";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";

export const runAssignmentStrategy = (
  assignmentStrategy: AssignmentStrategy,
  users: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.info(
    `Received data for ${users.length} users and ${programItems.length} program items`,
  );

  logger.info(
    `Assigning users for program items starting at ${startTime.toString()}`,
  );

  logger.info(`Assign strategy: ${assignmentStrategy}`);

  if (assignmentStrategy === AssignmentStrategy.PADG) {
    return runPadgStrategy(users, programItems, startTime, directSignups);
  }

  if (assignmentStrategy === AssignmentStrategy.RANDOM) {
    return runRandomStrategy(users, programItems, startTime, directSignups);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (assignmentStrategy === AssignmentStrategy.RANDOM_PADG) {
    return runRandomPadgStrategy(users, programItems, startTime, directSignups);
  }

  return exhaustiveSwitchGuard(assignmentStrategy);
};

const runPadgStrategy = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  const padgResultResult = padgAssignment(
    users,
    programItems,
    startTime,
    directSignups,
  );
  if (isErrorResult(padgResultResult)) {
    return padgResultResult;
  }
  const padgResult = unwrapResult(padgResultResult);
  return makeSuccessResult(padgResult);
};

const runRandomStrategy = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignment(
    users,
    programItems,
    startTime,
    directSignups,
  );
  if (isErrorResult(randomResultResult)) {
    return randomResultResult;
  }
  const randomResult = unwrapResult(randomResultResult);
  return makeSuccessResult(randomResult);
};

const runRandomPadgStrategy = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignment(
    users,
    programItems,
    startTime,
    directSignups,
  );
  if (isErrorResult(randomResultResult)) {
    logger.error(
      "%s",
      new Error(`Random assignment failed: ${randomResultResult.error}`),
    );
  }
  const randomResult = isErrorResult(randomResultResult)
    ? {
        results: [],
        message: `Random assignment failed: ${randomResultResult.error}`,
        algorithm: AssignmentStrategy.RANDOM,
        status: AssignmentResultStatus.ERROR,
      }
    : unwrapResult(randomResultResult);

  const padgResultResult = padgAssignment(
    users,
    programItems,
    startTime,
    directSignups,
  );
  if (isErrorResult(padgResultResult)) {
    logger.error(
      "%s",
      new Error(`PADG assignment failed: ${padgResultResult.error}`),
    );
  }
  const padgResult = isErrorResult(padgResultResult)
    ? {
        results: [],
        message: `PADG assignment failed: ${padgResultResult.error}`,
        algorithm: AssignmentStrategy.PADG,
        status: AssignmentResultStatus.ERROR,
      }
    : unwrapResult(padgResultResult);

  if (isErrorResult(randomResultResult) && isErrorResult(padgResultResult)) {
    logger.error(
      "%s",
      new Error(`Both random and PADG assignments failed, stop assignment`),
    );
    return makeErrorResult(AssignmentError.UNKNOWN_ERROR);
  }

  logger.info(
    `Random result: ${randomResult.results.length} attendees, Padg result: ${padgResult.results.length} attendees`,
  );

  if (
    padgResult.status === AssignmentResultStatus.ERROR ||
    randomResult.results.length > padgResult.results.length
  ) {
    logger.info("----> Use Random assign result");
    return makeSuccessResult(randomResult);
  }

  logger.info("----> Use Padg Assign result");
  return makeSuccessResult(padgResult);
};
