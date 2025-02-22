import fs from "node:fs";
import { distance, closest } from "fastest-levenshtein";
import { sortBy } from "lodash-es";
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

  const filteredResults = [];
  const pairSet = new Set();

  for (const pair of similarUsernames) {
    // Normalize the pair by sorting the usernames alphabetically
    const normalizedPair = [pair.username, pair.closest].sort().join(",");

    // If the pair is not in the set, add it to the set and include the item in the filtered results
    if (!pairSet.has(normalizedPair)) {
      pairSet.add(normalizedPair);
      filteredResults.push(pair);
    }
  }

  const sortedResults = sortBy(filteredResults, (result) => result.username);

  logger.info(JSON.stringify(sortedResults, null, 2));
  logger.info(`Found ${sortedResults.length} similar usernames`);
};
