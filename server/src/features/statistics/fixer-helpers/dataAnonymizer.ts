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

  const generatedUsernames = new Set<string>();
  const originalToReplacement = new Map<string, string>();
  for (const user of users) {
    const randomUsername = faker.number.int(1000000).toString();
    generatedUsernames.add(randomUsername);
    originalToReplacement.set(user.username, randomUsername);

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

  // Results and sign-ups can carry username strings that don't exactly match
  // any users.json row (case or whitespace variants have occurred in old
  // dumps), so the loop above misses them. Re-link to the account when a
  // normalized match is unambiguous, otherwise anonymize with a fresh id
  const normalizedToReplacement = new Map<string, string | null>();
  for (const [original, replacement] of originalToReplacement) {
    const normalized = original.trim().toLowerCase();
    // Two accounts normalizing to the same string cannot be re-linked safely
    normalizedToReplacement.set(
      normalized,
      normalizedToReplacement.has(normalized) ? null : replacement,
    );
  }
  const ghostUsernames = new Map<string, string>();
  const anonymizeGhost = (username: string): string => {
    if (username === "" || generatedUsernames.has(username)) return username;
    let replacement = ghostUsernames.get(username);
    if (!replacement) {
      const relinked = normalizedToReplacement.get(
        username.trim().toLowerCase(),
      );
      if (relinked) {
        replacement = relinked;
        logger.info(`ghost user re-linked: ${username} -> ${replacement}`);
      } else {
        replacement = faker.number.int(1000000).toString();
        logger.warn(
          `ghost user ${username} has no users.json match, anonymized to fresh id ${replacement} - remove the rows to keep the files consistent`,
        );
      }
      ghostUsernames.set(username, replacement);
    }
    return replacement;
  };
  for (const result of results) {
    for (const userResult of result.results) {
      userResult.username = anonymizeGhost(userResult.username);
    }
    for (const group of result.groups) {
      group.groupCreator = anonymizeGhost(group.groupCreator);
      group.groupMembers = group.groupMembers.map((groupMember) =>
        anonymizeGhost(groupMember),
      );
    }
  }
  for (const signup of directSignups) {
    for (const userSignup of signup.userSignups) {
      userSignup.username = anonymizeGhost(userSignup.username);
    }
  }

  // Remove sign-up message answers
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
