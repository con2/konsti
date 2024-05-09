import fs from "fs";
import {
  getSignupsByTime,
  getMaximumNumberOfPlayersByTime,
  getDemandByTime,
} from "./resultDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { ProgramItem } from "shared/types/models/programItem";

export const getResultsStats = (year: number, event: string): void => {
  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${results.length} results`);

  const programItems: ProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} games`);

  const signupsByTime = getSignupsByTime(results);
  const maximumNumberOfPlayersByTime =
    getMaximumNumberOfPlayersByTime(programItems);
  getDemandByTime(signupsByTime, maximumNumberOfPlayersByTime);
};
