import { config } from 'config';
import { UserArray } from 'typings/user.typings';

export const getAssignmentBonus = (playerGroup: UserArray): number => {
  const groupMembersWithEnteredGames = playerGroup.reduce((acc, curr) => {
    if (curr.enteredGames.length > 0) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const averageEnteredGames = groupMembersWithEnteredGames / playerGroup.length;

  const bonus = averageEnteredGames < 0.5 ? config.firtSignupBonus : 0;
  return bonus;
};
