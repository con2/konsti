import { logger } from 'utils/logger';
import { getStartingGames } from 'player-assignment/utils/getStartingGames';
import { runRandomAssignment } from 'player-assignment/random/utils/runRandomAssignment';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { PlayerAssignmentResult } from 'typings/result.typings';
import { getRunRandomAndPadgInput } from 'player-assignment/utils/getRunRandomAndPadgInput';
import _ from 'lodash';

export const randomAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string
): PlayerAssignmentResult => {
  logger.debug(`***** Run Random Assignment for ${startingTime}`);
  const startingGames = getStartingGames(games, startingTime);

  if (startingGames.length === 0) {
    logger.info('No starting games, stop!');
    return {
      results: [],
      message: 'Random Assign Result - No starting games',
      algorithm: 'Random',
      status: 'error: no starting games',
    };
  }
  const {
    signedGames,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  } = getRunRandomAndPadgInput(players, games, startingTime);

  if (signedGames.length === 0) {
    logger.info('No signup wishes, stop!');
    return {
      results: [],
      message: 'Random Assign Result - No signup wishes',
      algorithm: 'Random',
      status: 'error: no signup wishes',
    };
  }
  logger.debug(`Games with signups: ${signedGames.length}`);
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`
  );

  const result = runRandomAssignment(signedGames, playerGroups, startingTime);

  const selectedUniqueGames = _.uniq(
    result.results.map((result) => result.enteredGame.gameDetails.gameId)
  );

  const message = `Random Assign Result - Players: ${result.results.length}/${
    allPlayers.length
  } (${Math.round(
    (result.results.length / allPlayers.length) * 100
  )}%), Games: ${selectedUniqueGames.length}/${
    signedGames.length
  } (${Math.round((selectedUniqueGames.length / signedGames.length) * 100)}%)`;

  return Object.assign({
    ...result,
    message,
    algorithm: 'Random',
    status: 'success',
  });
};
