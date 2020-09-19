import fs from 'fs';
import {
  getUsersWithoutGames,
  getUsersWithoutSignups,
  getUsersSignupCount,
  getUsersWithAllGames,
} from './userDataHelpers';
import { logger } from 'utils/logger';

export const getUserStats = (year: number, event: string): void => {
  const users = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/users.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${users.length} users`);

  getUsersWithoutSignups(users);
  const usersWithoutGames = getUsersWithoutGames(users);
  getUsersSignupCount(usersWithoutGames);
  getUsersWithAllGames(users);
};
