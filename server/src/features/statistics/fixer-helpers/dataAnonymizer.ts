import fs from "fs";
import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "server/config";
import { Signup } from "server/features/signup/signup.typings";

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

  const signups: Signup[] = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/signups.json`,
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

    signups.forEach((signup) => {
      signup.userSignups.forEach((userSignup) => {
        if (user.username === userSignup.username) {
          logger.info(`signups.json: ${user.username} -> ${randomUsername}`);
          userSignup.username = randomUsername;
        }
      });
    });

    logger.info(`users.json: ${user.username} -> ${randomUsername}`);
    user.username = randomUsername;
  });

  // Remove signup message answers
  signups.forEach((signup) => {
    signup.userSignups.forEach((userSignup) => {
      if (userSignup.message !== "") {
        userSignup.message = "<redacted>";
      }
    });
  });

  writeJson(year, event, "users", users);
  writeJson(year, event, "results", results);
  writeJson(year, event, "signups", signups);
};
