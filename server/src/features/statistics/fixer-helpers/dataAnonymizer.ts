import fs from "node:fs";
import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { writeJson } from "server/features/statistics/statsUtil";
import { config } from "shared/config";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramItem } from "shared/types/models/programItem";

export const anonymizeData = async (
  event: string,
  year: number,
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const programItems: ProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
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

      for (const group of result.groups) {
        const isInGroup =
          group.groupCreator === user.username ||
          group.groupMembers.includes(user.username);
        if (!isInGroup) {
          continue;
        }
        logger.info(
          `results.json groups: ${user.username} -> ${randomUsername}`,
        );
        if (group.groupCreator === user.username) {
          group.groupCreator = randomUsername;
        }
        group.groupMembers = group.groupMembers.map((groupMember) =>
          groupMember === user.username ? randomUsername : groupMember,
        );
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
    // Kompassi login users have no local password
    user.password =
      user.password === "" || user.kompassiId !== 0 ? "" : "<redacted>";
    // @ts-expect-error -- Use invalid type for clarity
    user.kompassiId = user.kompassiId === 0 ? 0 : "<redacted>";
    user.email = user.email === "" ? "" : "<redacted>";
  }

  // Remove signup message answers
  for (const signup of directSignups) {
    for (const userSignup of signup.userSignups) {
      if (userSignup.message !== "") {
        userSignup.message = "<redacted>";
      }
    }
  }

  for (const programItem of programItems) {
    programItem.people = "<redacted>";
  }

  await writeJson(event, year, "users", users);
  await writeJson(event, year, "results", results);
  await writeJson(event, year, "direct-signups", directSignups);
  await writeJson(event, year, "program-items", programItems);
};
