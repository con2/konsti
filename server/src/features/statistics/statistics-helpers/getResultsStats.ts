import fs from "fs";
import {
  getSignupsByTime,
  getMaximumNumberOfPlayersByTime,
  getDemandByTime,
} from "./resultDataHelpers";
import { logger } from "server/utils/logger";
import { serverConfig } from "server/serverConfig";
import { ResultsCollectionEntry } from "server/typings/result.typings";
import { Game } from "shared/typings/models/game";

export const getResultsStats = (year: number, event: string): void => {
  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${serverConfig.statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${results.length} results`);

  const games: Game[] = JSON.parse(
    fs.readFileSync(
      `${serverConfig.statsDataDir}/${event}/${year}/games.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${games.length} games`);

  const signupsByTime = getSignupsByTime(results);
  const maximumNumberOfPlayersByTime = getMaximumNumberOfPlayersByTime(games);
  getDemandByTime(signupsByTime, maximumNumberOfPlayersByTime);
};
