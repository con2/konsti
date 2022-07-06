import fs from "fs";
import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "server/config";

export const anonymizeData = (year: number, event: string): void => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/users.json`,
      "utf8"
    )
  );

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/results.json`,
      "utf8"
    )
  );

  users.forEach((user) => {
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

  writeJson(year, event, "users", users);
  writeJson(year, event, "results", results);
};
