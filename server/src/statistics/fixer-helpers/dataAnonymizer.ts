import fs from 'fs';
import faker from 'faker';
import { logger } from 'utils/logger';
import { writeJson } from '../statsUtil';
import { User } from 'typings/user.typings';
import { ResultsCollectionEntry } from 'typings/result.typings';

export const anonymizeData = async (
  year: number,
  event: string
): Promise<void> => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/users.json`,
      'utf8'
    )
  );

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `src/statistics/datafiles/${event}/${year}/results.json`,
      'utf8'
    )
  );

  users.forEach((user) => {
    const randomUsername = faker.random.number(1000000).toString();

    results.forEach((result) => {
      result.results.forEach((userResult) => {
        if (user.username === userResult.username) {
          logger.info(`results.json: ${user.username} -> ${randomUsername}`);
          userResult.username = randomUsername;
        }
      });
    });

    logger.info(`users.json: ${user.username} -> ${randomUsername}`);
    user.username = randomUsername;
  });

  await writeJson(year, event, 'users', users);
  await writeJson(year, event, 'results', results);
};
