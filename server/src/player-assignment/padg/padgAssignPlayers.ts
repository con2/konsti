import _ from 'lodash';
import { logger } from 'utils/logger';
import { getStartingGames } from 'player-assignment/utils/getStartingGames';
import { getSignupWishes } from 'player-assignment/utils/getSignupWishes';
import { getSignedGames } from 'player-assignment/utils/getSignedGames';
import { getSelectedPlayers } from 'player-assignment/utils/getSelectedPlayers';
import { getPlayerGroups } from 'player-assignment/utils/getPlayerGroups';
import { getGroupMembers } from 'player-assignment/utils/getGroupMembers';
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

  const signupWishes = getSignupWishes(players);

  if (signupWishes.length === 0) {
    logger.info('No signup wishes, stop!');
    return {
      results: [],
      message: 'Padg Assign Result - No signup wishes',
      algorithm: 'padg',
      status: 'error: no signup wishes',
    };
  }

  const signedGames = getSignedGames(startingGames, signupWishes);

  // Get group leaders, selected players are group leaders since group members don't have signups yet
  const groupLeaders = getSelectedPlayers(players, startingGames);

  // Get group members based on group leaders
  const groupMembers = getGroupMembers(groupLeaders, players);

  // Combine group leaders and group members
  const allPlayers = groupLeaders.concat(groupMembers);

  // Combine users to groups, single user is size 1 group
  const playerGroups = getPlayerGroups(allPlayers);

  let numberOfIndividuals = 0;
  let numberOfGroups = 0;
  for (const playerGroup of playerGroups) {
    if (playerGroup.length > 1) {
      numberOfGroups += 1;
    } else {
      numberOfIndividuals += 1;
    }
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
