import fs from 'fs';
import {
  getGamesByStartingTime,
  getNumberOfFullGames,
  getDemandByTime,
  getDemandByGame,
} from './gameDataHelpers';
import { logger } from 'utils/logger';

export const getGameStats = (year: number, event: string): void => {
  const games = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/games.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${games.length} games`);

  const users = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/users.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${games.length} users`);

  getGamesByStartingTime(games);
  getNumberOfFullGames(games, users);
  getDemandByTime(games, users);
  getDemandByGame(games, users);
};
