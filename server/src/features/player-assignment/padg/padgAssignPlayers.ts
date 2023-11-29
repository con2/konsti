import _ from "lodash";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/typings/resultTypes";
import { getStartingGames } from "server/features/player-assignment/utils/getStartingGames";
import { getRunRandomAndPadgInput } from "server/features/player-assignment/utils/getRunRandomAndPadgInput";
import { runPadgAssignment } from "server/features/player-assignment/padg/utils/runPadgAssignment";
import { logger } from "server/utils/logger";
import { Signup } from "server/features/signup/signupTypes";
import {
  Result,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { AssignmentError } from "shared/typings/api/errors";
import { AssignmentStrategy } from "shared/config/sharedConfigTypes";

export const padgAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
  signups: readonly Signup[],
): Result<PlayerAssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Padg Assignment for ${startTime}`);
  const startingGames = getStartingGames(games, startTime);

  if (startingGames.length === 0) {
    logger.debug("No starting games, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assign Result - No starting games",
      algorithm: AssignmentStrategy.PADG,
      status: AssignmentResultStatus.NO_STARTING_GAMES,
    });
  }

  const {
    signedGames,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  } = getRunRandomAndPadgInput(players, games, startTime);
  if (signedGames.length === 0) {
    logger.debug("No signup wishes, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assign Result - No signup wishes",
      algorithm: AssignmentStrategy.PADG,
      status: AssignmentResultStatus.NO_SIGNUP_WISHES,
    });
  }

  logger.debug(`Games with signups: ${signedGames.length}`);
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`,
  );

  const assignmentResultResult = runPadgAssignment(
    signedGames,
    playerGroups,
    startTime,
    signups,
  );
  if (isErrorResult(assignmentResultResult)) {
    return assignmentResultResult;
  }

  const assignmentResult = unwrapResult(assignmentResultResult);

  const selectedUniqueGames = _.uniq(
    assignmentResult.results.map(
      (result) => result.enteredGame.gameDetails.gameId,
    ),
  );

  const message = `Padg Assign Result - Players: ${
    assignmentResult.results.length
  }/${allPlayers.length} (${Math.round(
    (assignmentResult.results.length / allPlayers.length) * 100,
  )}%), Games: ${selectedUniqueGames.length}/${
    signedGames.length
  } (${Math.round((selectedUniqueGames.length / signedGames.length) * 100)}%)`;

  logger.debug(`${message}`);

  return makeSuccessResult(
    Object.assign({
      ...assignmentResult,
      message,
      algorithm: AssignmentStrategy.PADG,
      status: AssignmentResultStatus.SUCCESS,
    }),
  );
};
