import fs from "fs";
import { distance, closest } from "fastest-levenshtein";
import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { config } from "shared/config";

export const getSimilarUsernames = (year: number, event: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/secret/users.json`,
      "utf8",
    ),
  );

  const usernames = users.map((user) => user.username.toLowerCase());

  const results = usernames.flatMap((username, index) => {
    const lowercaseUsername = username.toLowerCase();

    const usernamesWithoutCurrent = usernames
      .toSpliced(index, 1)
      .filter((comparedUsername) => {
        // Don't include usernames where two first letters are same
        return (
          comparedUsername.startsWith(lowercaseUsername[0]) &&
          comparedUsername[1] === lowercaseUsername[1]
        );
      });

    const closestSimilarUsername = closest(username, usernamesWithoutCurrent);
    if (!closestSimilarUsername) {
      return [];
    }
    const usernameDistance = distance(username, closestSimilarUsername);

    return {
      username,
      closest: closestSimilarUsername,
      distance: usernameDistance,
    };
  });

  const similarUsernames = results.filter((result) => result.distance === 1);

  logger.info(JSON.stringify(similarUsernames, null, 2));
  logger.info(`Found ${similarUsernames.length} similar usernames`);
};
