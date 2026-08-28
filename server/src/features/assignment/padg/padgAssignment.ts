import { unique } from "remeda";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { AssignmentError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { Result, makeSuccessResult } from "shared/utils/result";
import { runPadgAssignment } from "server/features/assignment/padg/utils/runPadgAssignment";
import { getRandomAndPadgInput } from "server/features/assignment/utils/getRandomAndPadgInput";
import { toPercentage } from "server/features/assignment/utils/toPercentage";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  AssignmentResult,
  AssignmentResultStatus,
} from "server/types/resultTypes";
import { logger } from "server/utils/logger";

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
  if (!assignmentResultResult.ok) {
    return assignmentResultResult;
  }

  const assignmentResult = assignmentResultResult.value;

  const selectedUniqueProgramItems = unique(
    assignmentResult.results.map(
      (result) => result.assignmentSignup.programItemId,
    ),
  );

  // Neither share is assumed to have a non-zero denominator - the attendees and the program
  // items are collected separately, so one can come out empty while the other doesn't
  const message = `Padg Assignment Result - Attendees: ${
    assignmentResult.results.length
  }/${allAttendees.length} (${toPercentage(
    assignmentResult.results.length,
    allAttendees.length,
  )}), Program items: ${selectedUniqueProgramItems.length}/${
    lotterySignupProgramItems.length
  } (${toPercentage(selectedUniqueProgramItems.length, lotterySignupProgramItems.length)})`;

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
