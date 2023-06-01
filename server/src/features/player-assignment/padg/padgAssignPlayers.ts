import _ from "lodash";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/typings/result.typings";
import { getStartingGames } from "server/features/player-assignment/utils/getStartingGames";
import { getRunRandomAndPadgInput } from "server/features/player-assignment/utils/getRunRandomAndPadgInput";
import { runPadgAssignment } from "server/features/player-assignment/padg/utils/runPadgAssignment";
import { logger } from "server/utils/logger";
import { Signup } from "server/features/signup/signup.typings";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError } from "shared/typings/api/errors";

export const padgAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string,
  signups: readonly Signup[]
): AsyncResult<PlayerAssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Padg Assignment for ${startingTime}`);
  const startingGames = getStartingGames(games, startingTime);

  if (startingGames.length === 0) {
    logger.debug("No starting games, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assign Result - No starting games",
      algorithm: "padg",
      status: AssignmentResultStatus.NO_STARTING_GAMES,
    });
  }

  const {
    signedGames,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  } = getRunRandomAndPadgInput(players, games, startingTime);
  if (signedGames.length === 0) {
    logger.debug("No signup wishes, stop!");
    return makeSuccessResult({
      results: [],
      message: "Padg Assign Result - No signup wishes",
      algorithm: "padg",
      status: AssignmentResultStatus.NO_SIGNUP_WISHES,
    });
  }

  logger.debug(`Games with signups: ${signedGames.length}`);
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`
  );

  const assignmentResultAsyncResult = runPadgAssignment(
    signedGames,
    playerGroups,
    startingTime,
    signups
  );
  if (isErrorResult(assignmentResultAsyncResult)) {
    return assignmentResultAsyncResult;
  }

  const assignmentResult = unwrapResult(assignmentResultAsyncResult);

  const selectedUniqueGames = _.uniq(
    assignmentResult.results.map(
      (result) => result.enteredGame.gameDetails.gameId
    )
  );

  const message = `Padg Assign Result - Players: ${
    assignmentResult.results.length
  }/${allPlayers.length} (${Math.round(
    (assignmentResult.results.length / allPlayers.length) * 100
  )}%), Games: ${selectedUniqueGames.length}/${
    signedGames.length
  } (${Math.round((selectedUniqueGames.length / signedGames.length) * 100)}%)`;

  logger.debug(`${message}`);

  return makeSuccessResult(
    Object.assign({
      ...assignmentResult,
      message,
      algorithm: "padg",
      status: "success",
    })
  );
};
