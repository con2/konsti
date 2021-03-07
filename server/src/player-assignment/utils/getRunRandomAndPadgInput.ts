import { getStartingGames } from 'player-assignment/utils/getStartingGames';
import { getSignupWishes } from 'player-assignment/utils/getSignupWishes';
import { getSignedGames } from 'player-assignment/utils/getSignedGames';
import { getSelectedPlayers } from 'player-assignment/utils/getSelectedPlayers';
import { getPlayerGroups } from 'player-assignment/utils/getPlayerGroups';
import { getGroupMembers } from 'player-assignment/utils/getGroupMembers';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';
import { runRandomAndPadgInput } from 'typings/result.typings';

export const getRunRandomAndPadgInput = (
  players: readonly User[],
  games: readonly Game[],
  startingTime: string
): runRandomAndPadgInput => {
  const startingGames = getStartingGames(games, startingTime);

  if (startingGames.length === 0) {
    return {
      signedGames: [],
      playerGroups: [],
      allPlayers: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const signupWishes = getSignupWishes(players);

  if (signupWishes.length === 0) {
    return {
      signedGames: [],
      playerGroups: [],
      allPlayers: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
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

  return {
    signedGames,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  };
};
