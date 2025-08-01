import { unique } from "remeda";
import { logger } from "server/utils/logger";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { runRandomAssignment } from "server/features/assignment/random/utils/runRandomAssignment";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  AssignmentResult,
} from "server/types/resultTypes";
import { getRandomAndPadgInput } from "server/features/assignment/utils/getRandomAndPadgInput";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";

export const randomAssignment = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Random Assignment for ${assignmentTime}`);
  const startingProgramItems = getStartingProgramItems(
    programItems,
    assignmentTime,
  );

  if (startingProgramItems.length === 0) {
    logger.debug("No starting program items, stop!");
    return makeSuccessResult({
      results: [],
      message: "Random Assignment Result - No starting program items",
      algorithm: AssignmentAlgorithm.RANDOM,
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
      message: "Random Assignment Result - No lottery signups",
      algorithm: AssignmentAlgorithm.RANDOM,
      status: AssignmentResultStatus.NO_LOTTERY_SIGNUPS,
    });
  }
  logger.debug(
    `Program items with lottery signups: ${lotterySignupProgramItems.length}`,
  );
  logger.debug(
    `Selected attendees: ${allAttendees.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  logger.debug("Random assignment: start");
  const assignmentResultResult = runRandomAssignment(
    lotterySignupProgramItems,
    attendeeGroups,
    assignmentTime,
    lotteryParticipantDirectSignups,
  );
  logger.debug("Random assignment: completed");
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueProgramItems = unique(
    assignmentResult.results.map(
      (result) => result.assignmentSignup.programItemId,
    ),
  );

  const message = `Random Assignment Result - Attendees: ${
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
      algorithm: AssignmentAlgorithm.RANDOM,
      status: AssignmentResultStatus.SUCCESS,
    }),
  );
};
