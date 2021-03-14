import _ from 'lodash';
import { logger } from 'server/utils/logger';
import { getStartingGames } from 'server/player-assignment/utils/getStartingGames';
import { getSignupWishes } from 'server/player-assignment/utils/getSignupWishes';
import { getSignedGames } from 'server/player-assignment/utils/getSignedGames';
import { getSelectedPlayers } from 'server/player-assignment/utils/getSelectedPlayers';
import { getPlayerGroups } from 'server/player-assignment/utils/getPlayerGroups';
import { getGroupMembers } from 'server/player-assignment/utils/getGroupMembers';
import { runPadgAssignment } from 'server/player-assignment/padg/utils/runPadgAssignment';
import { User } from 'server/typings/user.typings';
import { Game } from 'shared/typings/models/game';
import { PlayerAssignmentResult } from 'server/typings/result.typings';

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
