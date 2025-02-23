import fs from "node:fs";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const directSignups: DirectSignupsForProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/direct-signups.json`,
      "utf8",
    ),
  );

  for (const user of users) {
    const randomUsername = faker.number.int(1000000).toString();

    for (const result of results) {
      for (const userResult of result.results) {
        if (user.username === userResult.username) {
          logger.info(`results.json: ${user.username} -> ${randomUsername}`);
          userResult.username = randomUsername;
        }
      }
    }

    for (const signup of directSignups) {
      for (const userSignup of signup.userSignups) {
        if (user.username === userSignup.username) {
          logger.info(
            `direct-signups.json: ${user.username} -> ${randomUsername}`,
          );
          userSignup.username = randomUsername;
        }
      }
    }

    logger.info(`users.json: ${user.username} -> ${randomUsername}`);
    user.username = randomUsername;
    user.password = "<redacted>";
    // @ts-expect-error -- Use invalid type for clarity
    user.kompassiId = "<redacted>";
  }

  // Remove signup message answers
  for (const signup of directSignups) {
    for (const userSignup of signup.userSignups) {
      if (userSignup.message !== "") {
        userSignup.message = "<redacted>";
      }
    }
  }

  await writeJson(year, event, "users", users);
  await writeJson(year, event, "results", results);
  await writeJson(year, event, "direct-signups", directSignups);
};
