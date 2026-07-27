import fs from "node:fs";
import { sortBy } from "remeda";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { config } from "shared/config";

export const getMatchingEmails = (event: string, year: number): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  const usernamesByEmail = new Map<string, string[]>();

  for (const user of users) {
    // Anonymized dumps redact or omit the email field
    if (!user.email || user.email === "<redacted>") {
      continue;
    }
    const email = user.email.trim().toLowerCase();
    usernamesByEmail.set(email, [
      ...(usernamesByEmail.get(email) ?? []),
      user.username,
    ]);
  }

  const matchingEmails = [...usernamesByEmail]
    .filter(([_email, usernames]) => usernames.length > 1)
    .map(([email, usernames]) => ({ email, usernames }));

  const sortedResults = sortBy(matchingEmails, (result) => result.email);

  logger.info(JSON.stringify(sortedResults, null, 2));
  logger.info(`Found ${sortedResults.length} matching emails`);
};
