import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { Game } from "shared/types/models/game";

export const getSelectedPlayers = (
  players: readonly User[],
  startingGames: readonly Game[],
): User[] => {
  logger.debug("Get selected players");

  // Get users who have wishes for starting games
  const selectedPlayers = [] as User[];

  players.forEach((player) => {
    let match = false;
    for (let i = 0; i < player.lotterySignups.length; i += 1) {
      for (let j = 0; j < startingGames.length; j += 1) {
        if (
          player.lotterySignups[i].gameDetails.gameId ===
          startingGames[j].gameId
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
