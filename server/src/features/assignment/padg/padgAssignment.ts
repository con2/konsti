import { unique } from "remeda";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  AssignmentResult,
} from "server/types/resultTypes";
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
  startingProgramItems: readonly ProgramItem[],
  assignmentTime: string,
  lotteryParticipantDirectSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Padg Assignment for ${assignmentTime}`);

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
    lotteryParticipantDirectSignups,
  );
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueProgramItems = unique(
    assignmentResult.results.map(
      (result) => result.assignmentSignup.programItemId,
    ),
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
