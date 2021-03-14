import _ from 'lodash';
import { logger } from 'utils/logger';
import { getStartingGames } from 'player-assignment/utils/getStartingGames';
import { getRunRandomAndPadgInput } from 'player-assignment/utils/getRunRandomAndPadgInput';
import { runPadgAssignment } from 'player-assignment/padg/utils/runPadgAssignment';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { PlayerAssignmentResult } from 'typings/result.typings';

export const padgAssignPlayers = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string
): PlayerAssignmentResult => {
  logger.debug(`***** Run Padg Assignment for ${startingTime}`);
  const startingGames = getStartingGames(games, startingTime);

  if (startingGames.length === 0) {
    logger.info('No starting games, stop!');
    return {
      results: [],
      message: 'Padg Assign Result - No starting games',
      algorithm: 'padg',
      status: 'error: no starting games',
    };
  }

  // const signupWishes = getSignupWishes(players);
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
      message: 'Padg Assign Result - No signup wishes',
      algorithm: 'padg',
      status: 'error: no signup wishes',
    };
  }

  logger.debug(`Games with signups: ${signedGames.length}`);
  logger.debug(
    `Selected players: ${allPlayers.length} (${numberOfIndividuals} individual, ${numberOfGroups} groups)`
  );

  const result = runPadgAssignment(signedGames, playerGroups, startingTime);

  const selectedUniqueGames = _.uniq(
    result.results.map((result) => result.enteredGame.gameDetails.gameId)
  );

  const message = `Padg Assign Result - Players: ${result.results.length}/${
    allPlayers.length
  } (${Math.round(
    (result.results.length / allPlayers.length) * 100
  )}%), Games: ${selectedUniqueGames.length}/${
    signedGames.length
  } (${Math.round((selectedUniqueGames.length / signedGames.length) * 100)}%)`;

  logger.debug(`${message}`);

  return Object.assign({
    ...result,
    message,
    algorithm: 'padg',
    status: 'success',
  });
};
