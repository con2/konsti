import fs from "fs";
import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

export const anonymizeData = async (
  year: number,
  event: string,
): Promise<void> => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  const directSignups: DirectSignupsForProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/direct-signups.json`,
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

    directSignups.forEach((signup) => {
      signup.userSignups.forEach((userSignup) => {
        if (user.username === userSignup.username) {
          logger.info(
            `direct-signups.json: ${user.username} -> ${randomUsername}`,
          );
          userSignup.username = randomUsername;
        }
      });
    });

    logger.info(`users.json: ${user.username} -> ${randomUsername}`);
    user.username = randomUsername;
    user.password = "<redacted>";
    // @ts-expect-error -- Use invalid type for clarity
    user.kompassiId = "<redacted>";
  });

  // Remove signup message answers
  directSignups.forEach((signup) => {
    signup.userSignups.forEach((userSignup) => {
      if (userSignup.message !== "") {
        userSignup.message = "<redacted>";
      }
    });
  });

  await writeJson(year, event, "users", users);
  await writeJson(year, event, "results", results);
  await writeJson(year, event, "direct-signups", directSignups);
};
