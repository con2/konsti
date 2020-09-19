import moment from 'moment';
import { logger } from 'utils/logger';
import { Game } from 'typings/game.typings';

export const getStartingGames = (
  games: readonly Game[],
  startingTime: string
): readonly Game[] => {
  logger.debug('Get starting games');
  const startingGames = [] as Game[];
  const selectedStartingTime = moment(startingTime).format();

  // Get games that start at defined time
  games.forEach((game) => {
    const gameStartingTime = moment(game.startTime).format();
    if (gameStartingTime === selectedStartingTime) {
      startingGames.push(game);
    }
  });

  logger.debug(`Found ${startingGames.length} games for this starting time`);

  return startingGames;
};
