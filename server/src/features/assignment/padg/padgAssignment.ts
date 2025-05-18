import { unique } from "remeda";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  AssignmentResult,
} from "server/types/resultTypes";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { getRandomAndPadgInput } from "server/features/assignment/utils/getRandomAndPadgInput";
import { runPadgAssignment } from "server/features/assignment/padg/utils/runPadgAssignment";
import { logger } from "server/utils/logger";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";

export const padgAssignment = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryValidDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Padg Assignment for ${assignmentTime}`);
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );

  if (startingProgramItems.length === 0) {
    logger.debug("No starting program items, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assignment Result - No starting program items",
      algorithm: AssignmentAlgorithm.PADG,
      status: AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
    });
  }

  const {
    lotterySignupProgramItems,
    attendeeGroups,
    allAttendees,
    numberOfIndividuals,
    numberOfGroups,
  } = getRandomAndPadgInput(users, startingProgramItems);

  if (lotterySignupProgramItems.length === 0) {
    logger.debug("No lottery signups, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assignment Result - No lottery signups",
      algorithm: AssignmentAlgorithm.PADG,
      status: AssignmentResultStatus.NO_LOTTERY_SIGNUPS,
    });
  }

  logger.debug(
    `Program items with lottery signups: ${lotterySignupProgramItems.length}`,
  );
  logger.debug(
    `Selected attendees: ${allAttendees.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  const assignmentResultResult = runPadgAssignment(
    lotterySignupProgramItems,
    attendeeGroups,
    assignmentTime,
    lotteryValidDirectSignups,
  );
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueProgramItems = unique(
    assignmentResult.results.map((result) => result.directSignup.programItemId),
  );

  const message = `Padg Assignment Result - Attendees: ${
    assignmentResult.results.length
  }/${allAttendees.length} (${Math.round(
    (assignmentResult.results.length / allAttendees.length) * 100,
  )}%), Program items: ${selectedUniqueProgramItems.length}/${
    lotterySignupProgramItems.length
  } (${Math.round((selectedUniqueProgramItems.length / lotterySignupProgramItems.length) * 100)}%)`;

  logger.debug(message);

  return makeSuccessResult(
    Object.assign({
      ...assignmentResult,
      message,
      algorithm: AssignmentAlgorithm.PADG,
      status: AssignmentResultStatus.SUCCESS,
    }),
  );
};
