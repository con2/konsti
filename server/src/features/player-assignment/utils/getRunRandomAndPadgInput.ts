import { getStartingGames } from "server/features/player-assignment/utils/getStartingGames";
import { getSignupWishes } from "server/features/player-assignment/utils/getSignupWishes";
import { getLotterySignupGames } from "server/features/player-assignment/utils/getLotterySignupGames";
import { getSelectedPlayers } from "server/features/player-assignment/utils/getSelectedPlayers";
import { getPlayerGroups } from "server/features/player-assignment/utils/getPlayerGroups";
import { getGroupMembers } from "server/features/player-assignment/utils/getGroupMembers";
import { User } from "shared/types/models/user";
import { Game } from "shared/types/models/game";
import { RunRandomAndPadgInput } from "server/types/resultTypes";

export const getRunRandomAndPadgInput = (
  players: readonly User[],
  games: readonly Game[],
  startTime: string,
): RunRandomAndPadgInput => {
  const startingGames = getStartingGames(games, startTime);

  if (startingGames.length === 0) {
    return {
      lotterySignupGames: [],
      playerGroups: [],
      allPlayers: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const signupWishes = getSignupWishes(players);

  if (signupWishes.length === 0) {
    return {
      lotterySignupGames: [],
      playerGroups: [],
      allPlayers: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const lotterySignupGames = getLotterySignupGames(startingGames, signupWishes);

  // Get group creators, selected players are group creators since group members don't have signups yet
  const groupCreators = getSelectedPlayers(players, startingGames);

  // Get group members based on group creators
  const groupMembers = getGroupMembers(groupCreators, players);

  // Combine group creators and group members
  const allPlayers = groupCreators.concat(groupMembers);

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
    lotterySignupGames,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  };
};
