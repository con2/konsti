import { logger } from 'utils/logger';
import { User } from 'typings/user.typings';
import { Game } from 'typings/game.typings';

export const getSelectedPlayers = (
  players: readonly User[],
  startingGames: readonly Game[]
): User[] => {
  logger.debug('Get selected players');

  // Get users who have wishes for starting games
  const selectedPlayers = [] as User[];

  players.forEach((player) => {
    let match = false;
    for (let i = 0; i < player.signedGames.length; i += 1) {
      for (let j = 0; j < startingGames.length; j += 1) {
        if (
          player.signedGames[i].gameDetails.gameId === startingGames[j].gameId
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

  logger.debug(
    `Found ${selectedPlayers.length} players for this starting time`
  );

  return selectedPlayers;
};
