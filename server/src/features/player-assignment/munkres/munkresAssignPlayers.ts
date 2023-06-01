import munkres from "munkres-js";
import { logger } from "server/utils/logger";
import { getStartingGames } from "server/features/player-assignment/utils/getStartingGames";
import { getSignupWishes } from "server/features/player-assignment/utils/getSignupWishes";
import { getSignedGames } from "server/features/player-assignment/utils/getSignedGames";
import { getSelectedPlayers } from "server/features/player-assignment/utils/getSelectedPlayers";
import { getSignupMatrix } from "server/features/player-assignment/munkres/utils/getSignupMatrix";
import { checkMinAttendance } from "server/features/player-assignment/munkres/utils/checkMinAttendance";
import { getRemovedGame } from "server/features/player-assignment/munkres/utils/getRemovedGame";
import { getPriorities } from "server/features/player-assignment/munkres/utils/getPriorities";
import { getPlayersWithTooHighPriority } from "server/features/player-assignment/munkres/utils/getPlayersWithTooHighPriority";
import { getRemovedPlayer } from "server/features/player-assignment/munkres/utils/getRemovedPlayer";
import { buildSignupResults } from "server/features/player-assignment/munkres/utils/buildSignupResults";
import { User } from "shared/typings/models/user";
import { Game } from "shared/typings/models/game";
import {
  AssignmentResultStatus,
  PlayerAssignmentResult,
} from "server/typings/result.typings";
import {
  AsyncResult,
  isErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/asyncResult";
import { AssignmentError } from "shared/typings/api/errors";

export const munkresAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string
): AsyncResult<PlayerAssignmentResult, AssignmentError> => {
  logger.debug(`***** Run Munkres Assignment for ${startingTime}`);
  const startingGames = getStartingGames(games, startingTime);
  const signupWishes = getSignupWishes(players);
  const signedGames = getSignedGames(startingGames, signupWishes);
  const selectedPlayers = getSelectedPlayers(players, startingGames);
  const signupMatrix = getSignupMatrix(signedGames, selectedPlayers);

  const initialGamesCount = signedGames.length;
  const initialPlayerCount = selectedPlayers.length;
  let removedGamesCount = 0;
  let removedPlayerCount = 0;

  // Run the algorithm
  let results: readonly number[][] = munkres(signupMatrix);

  let gamesWithTooFewPlayers = checkMinAttendance(results, signedGames);

  while (gamesWithTooFewPlayers.length > 0) {
    const removedGame = getRemovedGame(gamesWithTooFewPlayers);

    for (let i = 0; i < signedGames.length; i += 1) {
      if (signedGames[i].gameId === removedGame.gameId) {
        logger.info(`Removed game "${signedGames[i].title}"`);
        signedGames.splice(i, 1);
        removedGamesCount += 1;
        break;
      }
    }

    results = munkres(signupMatrix);
    gamesWithTooFewPlayers = checkMinAttendance(results, signedGames);
  }

  // Map usernames back to player IDs before altering players array
  let priorities = getPriorities(results, signupMatrix);
  let playersWithTooHighPriority = getPlayersWithTooHighPriority(priorities);

  while (playersWithTooHighPriority.length > 0) {
    const removedPlayer = getRemovedPlayer(playersWithTooHighPriority);

    logger.info(`Removed player ${removedPlayer.playerId}`);
    selectedPlayers.splice(removedPlayer.playerId, 1);
    removedPlayerCount += 1;

    results = munkres(signupMatrix);
    priorities = getPriorities(results, signupMatrix);
    playersWithTooHighPriority = getPlayersWithTooHighPriority(priorities);
  }

  logger.info(`Removed ${removedGamesCount}/${initialGamesCount} games`);
  logger.info(`Removed ${removedPlayerCount}/${initialPlayerCount} players`);

  const signupResultsAsyncResult = buildSignupResults(
    results,
    signedGames,
    selectedPlayers
  );
  if (isErrorResult(signupResultsAsyncResult)) {
    return signupResultsAsyncResult;
  }

  const signupResults = unwrapResult(signupResultsAsyncResult);
  const message = "Munkres assignment completed";

  logger.debug(`${message}`);

  return makeSuccessResult({
    results: signupResults,
    message,
    algorithm: "munkres",
    status: AssignmentResultStatus.SUCCESS,
  });
};
