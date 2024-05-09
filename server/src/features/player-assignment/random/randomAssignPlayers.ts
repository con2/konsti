import { uniq } from "lodash-es";
import { logger } from "server/utils/logger";
import { getStartingGames } from "server/features/player-assignment/utils/getStartingGames";
import { runRandomAssignment } from "server/features/player-assignment/random/utils/runRandomAssignment";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/types/resultTypes";
import { getRunRandomAndPadgInput } from "server/features/player-assignment/utils/getRunRandomAndPadgInput";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/types/api/errors";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";

export const randomAssignPlayers = (
  players: readonly User[],
  games: readonly ProgramItem[],
  startTime: string,
  directSignups: readonly DirectSignupsForProgramItem[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Random Assignment for ${startTime}`);
  const startingGames = getStartingGames(games, startTime);

  if (startingGames.length === 0) {
    logger.debug("No starting games, stop!");
    return makeSuccessResult({
      results: [],
      message: "Random Assign Result - No starting games",
      algorithm: AssignmentStrategy.RANDOM,
      status: AssignmentResultStatus.NO_STARTING_GAMES,
    });
  }
  const {
    lotterySignupGames,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  } = getRunRandomAndPadgInput(players, games, startTime);

  if (lotterySignupGames.length === 0) {
    logger.debug("No signup wishes, stop!");
    return makeSuccessResult({
      results: [],
      message: "Random Assign Result - No signup wishes",
      algorithm: AssignmentStrategy.RANDOM,
      status: AssignmentResultStatus.NO_SIGNUP_WISHES,
    });
  }
  logger.debug(`Games with lottery signups: ${lotterySignupGames.length}`);
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  const assignmentResultResult = runRandomAssignment(
    lotterySignupGames,
    playerGroups,
    startTime,
    directSignups,
  );
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueGames = uniq(
    assignmentResult.results.map(
      (result) => result.directSignup.programItemDetails.programItemId,
    ),
  );

  const message = `Random Assign Result - Players: ${
    assignmentResult.results.length
  }/${allPlayers.length} (${Math.round(
    (assignmentResult.results.length / allPlayers.length) * 100,
  )}%), Games: ${selectedUniqueGames.length}/${
    lotterySignupGames.length
  } (${Math.round((selectedUniqueGames.length / lotterySignupGames.length) * 100)}%)`;

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
