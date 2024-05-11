import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ProgramItem } from "shared/types/models/programItem";

export const getSelectedPlayers = (
  players: readonly User[],
  startingProgramItems: readonly ProgramItem[],
): User[] => {
  logger.debug("Get selected players");

  // Get users who have lottery signups for starting program items
  const selectedPlayers = [] as User[];

  players.forEach((player) => {
    let match = false;
    for (let i = 0; i < player.lotterySignups.length; i += 1) {
      for (let j = 0; j < startingProgramItems.length; j += 1) {
        if (
          player.lotterySignups[i].programItem.programItemId ===
          startingProgramItems[j].programItemId
        ) {
          match = true;
          break;
        }
      }
      // Player matched, break
      if (match) {
        selectedPlayers.push(player);
        break;
      }
    }
  });

  logger.debug(`Found ${selectedPlayers.length} players for this start time`);

  return selectedPlayers;
};
