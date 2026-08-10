import { faker } from "@faker-js/faker";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import {
  jsonFileExists,
  readJson,
  writeJson,
} from "server/features/statistics/statsUtil";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import { ProgramItem } from "shared/types/models/programItem";

export const anonymizeData = async (
  event: string,
  year: number,
): Promise<void> => {
  const users = readJson<User>(event, year, "users");
  // Direct-sign-up-only events have no results.json
  const hasResults = jsonFileExists(event, year, "results");
  const results = hasResults
    ? readJson<ResultsCollectionEntry>(event, year, "results")
    : [];
  const directSignups = readJson<DirectSignupsForProgramItem>(
    event,
    year,
    "direct-signups",
  );
  const programItems = readJson<ProgramItem>(event, year, "program-items");

  const accountNameCounts = new Map<string, number>();
  for (const user of users) {
    accountNameCounts.set(
      user.username,
      (accountNameCounts.get(user.username) ?? 0) + 1,
    );
  }
  const normalizedToOriginal = new Map<string, string | null>();
  for (const name of accountNameCounts.keys()) {
    const normalized = name.trim().toLowerCase();
    normalizedToOriginal.set(
      normalized,
      normalizedToOriginal.has(normalized) ? null : name,
    );
  }

  const rowUsernames = new Set<string>();
  for (const result of results) {
    for (const userResult of result.results) {
      rowUsernames.add(userResult.username);
    }
    for (const group of result.groups) {
      if (group.groupCreator !== "") {
        rowUsernames.add(group.groupCreator);
      }
      for (const groupMember of group.groupMembers) {
        rowUsernames.add(groupMember);
      }
    }
  }
  for (const signup of directSignups) {
    for (const userSignup of signup.userSignups) {
      rowUsernames.add(userSignup.username);
    }
  }

  // Every row username must be attributable to exactly one account before
  // anything is overwritten, so the operator can resolve problems while the
  // original names are still on disk. Konsti usernames are case-sensitive,
  // so a re-linked variant can in principle be a different person and is
  // logged for manual review
  const relinks = new Map<string, string>();
  const unresolved: string[] = [];
  for (const name of rowUsernames) {
    const exactMatches = accountNameCounts.get(name) ?? 0;
    if (exactMatches === 1) continue;
    if (exactMatches > 1) {
      unresolved.push(`${name} (matches multiple accounts)`);
      continue;
    }
    const original = normalizedToOriginal.get(name.trim().toLowerCase());
    if (typeof original === "string" && accountNameCounts.get(original) === 1) {
      logger.warn(
        `Re-linking ${name} to account ${original} by case-insensitive match - verify they are the same person`,
      );
      relinks.set(name, original);
      continue;
    }
    unresolved.push(
      original === null
        ? `${name} (matches multiple accounts)`
        : `${name} (no matching account)`,
    );
  }
  if (unresolved.length > 0) {
    logger.error(
      new Error(
        `Anonymization aborted, resolve these usernames first: ${unresolved.join(", ")}`,
      ),
    );
    return;
  }

  // Track every username in the dump so a generated name can never collide
  // with another account (random draws alone have produced duplicate
  // usernames in past dumps)
  const usedUsernames = new Set<string>([
    ...accountNameCounts.keys(),
    ...rowUsernames,
  ]);
  const nextUsername = (): string => {
    let candidate = faker.number.int(1000000).toString();
    while (usedUsernames.has(candidate)) {
      candidate = faker.number.int(1000000).toString();
    }
    usedUsernames.add(candidate);
    return candidate;
  };

  const replacements = new Map<string, string>();
  for (const user of users) {
    const randomUsername = nextUsername();
    replacements.set(user.username, randomUsername);
    logger.info(`users.json: ${user.username} -> ${randomUsername}`);
    user.username = randomUsername;
    // Kompassi login users have no local password
    user.password =
      user.password === "" || user.kompassiId !== "" ? "" : "<redacted>";
    user.kompassiId = user.kompassiId === "" ? "" : "<redacted>";
    user.email = user.email === "" ? "" : "<redacted>";
  }

  const anonymize = (username: string): string => {
    if (username === "") {
      return username;
    }
    return replacements.get(relinks.get(username) ?? username) ?? username;
  };

  for (const result of results) {
    for (const userResult of result.results) {
      userResult.username = anonymize(userResult.username);
    }
    for (const group of result.groups) {
      group.groupCreator = anonymize(group.groupCreator);
      group.groupMembers = group.groupMembers.map((groupMember) =>
        anonymize(groupMember),
      );
    }
  }
  for (const signup of directSignups) {
    for (const userSignup of signup.userSignups) {
      userSignup.username = anonymize(userSignup.username);
      // Remove sign-up message answers
      if (userSignup.message !== "") {
        userSignup.message = "<redacted>";
      }
    }
  }

  for (const programItem of programItems) {
    programItem.people = "<redacted>";
  }

  await writeJson(event, year, "users", users);
  if (hasResults) {
    await writeJson(event, year, "results", results);
  }
  await writeJson(event, year, "direct-signups", directSignups);
  await writeJson(event, year, "program-items", programItems);
};
