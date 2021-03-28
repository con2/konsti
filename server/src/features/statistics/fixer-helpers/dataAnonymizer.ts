import fs from 'fs';
import faker from 'faker';
import { logger } from 'server/utils/logger';
import { User } from 'server/typings/user.typings';
import { ResultsCollectionEntry } from 'server/typings/result.typings';
import { writeJson } from 'server/features/statistics/statsUtil';

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
    // @ts-expect-error @types/faker not updated yet
    const randomUsername = faker.datatype.number(1000000).toString();

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
