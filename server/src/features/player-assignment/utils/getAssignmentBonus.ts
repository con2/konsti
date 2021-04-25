import { config } from 'server/config';
import { User } from 'shared/typings/models/user';

export const getAssignmentBonus = (playerGroup: User[]): number => {
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
