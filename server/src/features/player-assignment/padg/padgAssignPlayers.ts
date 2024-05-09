import { uniq } from "lodash-es";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/types/resultTypes";
import { getStartingProgramItems } from "server/features/player-assignment/utils/getStartingProgramItems";
import { getRunRandomAndPadgInput } from "server/features/player-assignment/utils/getRunRandomAndPadgInput";
import { runPadgAssignment } from "server/features/player-assignment/padg/utils/runPadgAssignment";
import { logger } from "server/utils/logger";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";

export const padgAssignPlayers = (
  players: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Padg Assignment for ${startTime}`);
  const startingProgramItems = getStartingProgramItems(programItems, startTime);

  if (startingProgramItems.length === 0) {
    logger.debug("No starting program items, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assign Result - No starting program items",
      algorithm: AssignmentStrategy.PADG,
      status: AssignmentResultStatus.NO_STARTING_PROGRAM_ITEMS,
    });
  }

  const {
    lotterySignupProgramItems,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  } = getRunRandomAndPadgInput(players, programItems, startTime);
  if (lotterySignupProgramItems.length === 0) {
    logger.debug("No signup wishes, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assign Result - No signup wishes",
      algorithm: AssignmentStrategy.PADG,
      status: AssignmentResultStatus.NO_SIGNUP_WISHES,
    });
  }

  logger.debug(
    `Program items with lottery signups: ${lotterySignupProgramItems.length}`,
  );
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  const assignmentResultResult = runPadgAssignment(
    lotterySignupProgramItems,
    playerGroups,
    startTime,
    directSignups,
  );
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueProgramItems = uniq(
    assignmentResult.results.map(
      (result) => result.directSignup.programItemDetails.programItemId,
    ),
  );

  const message = `Padg Assign Result - Players: ${
    assignmentResult.results.length
  }/${allPlayers.length} (${Math.round(
    (assignmentResult.results.length / allPlayers.length) * 100,
  )}%), Program items: ${selectedUniqueProgramItems.length}/${
    lotterySignupProgramItems.length
  } (${Math.round((selectedUniqueProgramItems.length / lotterySignupProgramItems.length) * 100)}%)`;

  logger.debug(message);

  return makeSuccessResult(
    Object.assign({
      ...assignmentResult,
      message,
      algorithm: AssignmentStrategy.PADG,
      status: AssignmentResultStatus.SUCCESS,
    }),
  );
};
