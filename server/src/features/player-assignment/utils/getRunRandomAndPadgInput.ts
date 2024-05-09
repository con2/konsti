import { getStartingProgramItems } from "server/features/player-assignment/utils/getStartingProgramItems";
import { getSignupWishes } from "server/features/player-assignment/utils/getSignupWishes";
import { getLotterySignupProgramItems } from "server/features/player-assignment/utils/getLotterySignupProgramItems";
import { getSelectedPlayers } from "server/features/player-assignment/utils/getSelectedPlayers";
import { getPlayerGroups } from "server/features/player-assignment/utils/getPlayerGroups";
import { getGroupMembers } from "server/features/player-assignment/utils/getGroupMembers";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";
import { RunRandomAndPadgInput } from "server/types/resultTypes";

export const getRunRandomAndPadgInput = (
  players: readonly User[],
  programItems: readonly ProgramItem[],
  startTime: string,
): RunRandomAndPadgInput => {
  const startingProgramItems = getStartingProgramItems(programItems, startTime);

  if (startingProgramItems.length === 0) {
    return {
      lotterySignupProgramItems: [],
      playerGroups: [],
      allPlayers: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const signupWishes = getSignupWishes(players);

  if (signupWishes.length === 0) {
    return {
      lotterySignupProgramItems: [],
      playerGroups: [],
      allPlayers: [],
      numberOfIndividuals: 0,
      numberOfGroups: 0,
    };
  }

  const lotterySignupProgramItems = getLotterySignupProgramItems(
    startingProgramItems,
    signupWishes,
  );

  // Get group creators, selected players are group creators since group members don't have signups yet
  const groupCreators = getSelectedPlayers(players, startingProgramItems);

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
    lotterySignupProgramItems,
    playerGroups,
    allPlayers,
    numberOfIndividuals,
    numberOfGroups,
  };
};
