import fs from 'fs';
import {
  getSignupsByTime,
  getMaximumNumberOfPlayersByTime,
  getDemandByTime,
} from './resultDataHelpers';
import { logger } from 'server/utils/logger';
import { config } from 'server/config';

export const getResultsStats = (year: number, event: string): void => {
  const results = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/results.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${results.length} results`);

  const games = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/games.json`,
      'utf8'
    )
  );

  logger.info(`Loaded ${games.length} games`);

  const signupsByTime = getSignupsByTime(results);
  const maximumNumberOfPlayersByTime = getMaximumNumberOfPlayersByTime(games);
  getDemandByTime(signupsByTime, maximumNumberOfPlayersByTime);
};
