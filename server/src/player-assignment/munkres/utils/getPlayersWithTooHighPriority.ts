import { logger } from 'utils/logger';
import { PlayerIdWithPriority } from 'typings/user.typings';

export const getPlayersWithTooHighPriority = (
  priorities: readonly PlayerIdWithPriority[]
): PlayerIdWithPriority[] => {
  const playersWithTooHighPriority: PlayerIdWithPriority[] = [];

  priorities.forEach((priority) => {
    if (priority.priorityValue === 9) {
      playersWithTooHighPriority.push(priority);
      logger.info(`Priority too high for player ${priority.playerId}`);
    }
  });

  return playersWithTooHighPriority;
};
