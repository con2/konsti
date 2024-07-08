import { uniq } from "lodash-es";
import { logger } from "server/utils/logger";
import { getStartingProgramItems } from "server/features/assignment/utils/getStartingProgramItems";
import { runRandomAssignment } from "server/features/assignment/random/utils/runRandomAssignment";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  AssignmentResult,
} from "server/types/resultTypes";
import { getRunRandomAndPadgInput } from "server/features/assignment/utils/getRunRandomAndPadgInput";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";

export const randomAssignment = (
  users: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<AssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Random Assignment for ${startTime}`);
  const startingProgramItems = getStartingProgramItems(programItems, startTime);

  if (startingProgramItems.length === 0) {
    logger.debug("No starting program items, stop!");
    return makeSuccessResult({
      results: [],
      message: "Random Assignment Result - No starting program items",
      algorithm: AssignmentStrategy.RANDOM,
      status: AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
    });
  }
  const {
    lotterySignupProgramItems,
    attendeeGroups,
    allAttendees,
    numberOfIndividuals,
    numberOfGroups,
  } = getRunRandomAndPadgInput(users, programItems, startTime);

  if (lotterySignupProgramItems.length === 0) {
    logger.debug("No lottery signups, stop!");
    return makeSuccessResult({
      results: [],
      message: "Random Assignment Result - No lottery signups",
      algorithm: AssignmentStrategy.RANDOM,
      status: AssignmentResultStatus.NO_LOTTERY_SIGNUPS,
    });
  }
  logger.debug(
    `Program items with lottery signups: ${lotterySignupProgramItems.length}`,
  );
  logger.debug(
    `Selected attendees: ${allAttendees.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  const assignmentResultResult = runRandomAssignment(
    lotterySignupProgramItems,
    attendeeGroups,
    startTime,
    directSignups,
  );
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueProgramItems = uniq(
    assignmentResult.results.map(
      (result) => result.directSignup.programItem.programItemId,
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
      algorithm: AssignmentStrategy.RANDOM,
      status: AssignmentResultStatus.SUCCESS,
    }),
  );
};
