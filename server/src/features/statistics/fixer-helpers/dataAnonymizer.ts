import fs from "fs";
import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { User } from "shared/typings/models/user";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { writeJson } from "server/features/statistics/statsUtil";
import { serverConfig } from "server/serverConfig";
import { Signup } from "server/features/signup/signup.typings";

export const anonymizeData = async (
  year: number,
  event: string,
): Promise<void> => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${serverConfig.statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${serverConfig.statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  const signups: Signup[] = JSON.parse(
    fs.readFileSync(
      `${serverConfig.statsDataDir}/${event}/${year}/signups.json`,
      "utf8",
    ),
  );

  users.forEach((user) => {
    const randomUsername = faker.number.int(1000000).toString();

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

  await writeJson(year, event, "users", users);
  await writeJson(year, event, "results", results);
  await writeJson(year, event, "signups", signups);
};
