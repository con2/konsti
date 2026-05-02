import { logger } from "server/utils/logger";
import { padgAssignment } from "server/features/assignment/padg/padgAssignment";
import { randomAssignment } from "server/features/assignment/random/randomAssignment";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  AssignmentResult,
} from "server/types/resultTypes";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";

export const runAssignmentAlgorithm = (
  assignmentAlgorithm: AssignmentAlgorithm,
  users: readonly User[],
  programItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.info(
    `Received data for ${users.length} users and ${programItems.length} program items for ${assignmentTime}`,
  );

  logger.info(`Assign algorithm: ${assignmentAlgorithm}`);

  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );

  if (startingProgramItems.length === 0) {
    logger.debug("No starting program items, stop!");
    return makeSuccessResult({
      results: [],
      message: `${assignmentAlgorithm} Assignment Result - No starting program items`,
      algorithm: assignmentAlgorithm,
      status: AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
    });
  }

  if (assignmentAlgorithm === AssignmentAlgorithm.PADG) {
    return runPadgAlgorithm(
      users,
      startingProgramItems,
      assignmentTime,
      lotteryParticipantDirectSignups,
    );
  }

  if (assignmentAlgorithm === AssignmentAlgorithm.RANDOM) {
    return runRandomAlgorithm(
      users,
      startingProgramItems,
      assignmentTime,
      lotteryParticipantDirectSignups,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (assignmentAlgorithm === AssignmentAlgorithm.RANDOM_PADG) {
    return runRandomPadgAlgorithm(
      users,
      startingProgramItems,
      assignmentTime,
      lotteryParticipantDirectSignups,
    );
  }

  return exhaustiveSwitchGuard(assignmentAlgorithm);
};

const runPadgAlgorithm = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  const padgResultResult = padgAssignment(
    users,
    startingProgramItems,
    assignmentTime,
    lotteryParticipantDirectSignups,
  );
  if (!padgResultResult.ok) {
    return padgResultResult;
  }
  const padgResult = padgResultResult.value;
  return makeSuccessResult(padgResult);
};

const runRandomAlgorithm = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignment(
    users,
    startingProgramItems,
    assignmentTime,
    lotteryParticipantDirectSignups,
  );
  if (!randomResultResult.ok) {
    return randomResultResult;
  }
  const randomResult = randomResultResult.value;
  return makeSuccessResult(randomResult);
};

const runRandomPadgAlgorithm = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  const randomResultResult = randomAssignment(
    users,
    startingProgramItems,
    assignmentTime,
    lotteryParticipantDirectSignups,
  );
  if (!randomResultResult.ok) {
    logger.error(
      "%s",
      new Error(`Random assignment failed: ${randomResultResult.error}`),
    );
  }
  const randomResult = randomResultResult.ok
    ? randomResultResult.value
    : {
        results: [],
        message: `Random assignment failed: ${randomResultResult.error}`,
        algorithm: AssignmentAlgorithm.RANDOM,
        status: AssignmentResultStatus.ERROR,
      };

  const padgResultResult = padgAssignment(
    users,
    startingProgramItems,
    assignmentTime,
    lotteryParticipantDirectSignups,
  );
  if (!padgResultResult.ok) {
    logger.error(
      "%s",
      new Error(`PADG assignment failed: ${padgResultResult.error}`),
    );
  }
  const padgResult = padgResultResult.ok
    ? padgResultResult.value
    : {
        results: [],
        message: `PADG assignment failed: ${padgResultResult.error}`,
        algorithm: AssignmentAlgorithm.PADG,
        status: AssignmentResultStatus.ERROR,
      };

  if (!randomResultResult.ok && !padgResultResult.ok) {
    logger.error(
      "%s",
      new Error("Both random and PADG assignments failed, stop assignment"),
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
