import { unique } from "remeda";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { AssignmentError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { runRandomAssignment } from "server/features/assignment/random/utils/runRandomAssignment";
import { getRandomAndPadgInput } from "server/features/assignment/utils/getRandomAndPadgInput";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  AssignmentResult,
  AssignmentResultStatus,
} from "server/types/resultTypes";
import { logger } from "server/utils/logger";

export const randomAssignment = (
  users: readonly User[],
  startingProgramItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Random Assignment for ${assignmentTime}`);

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
  if (!assignmentResultResult.ok) {
    return assignmentResultResult;
  }

  const assignmentResult = assignmentResultResult.value;

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
