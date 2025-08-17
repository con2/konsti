import fs from "node:fs";
import {
  getSignupsByTime,
  getMaximumNumberOfAttendeesByTime,
  getDemandByTime,
} from "./resultDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ResultsCollectionEntry } from "server/types/resultTypes";
import { ProgramItem } from "shared/types/models/programItem";

export const getResultsStats = (event: string, year: number): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const results: ResultsCollectionEntry[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/results.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${results.length} results`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const programItems: ProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} program items`);

  const signupsByTime = getSignupsByTime(results);
  const maximumNumberOfAttendeesByTime =
    getMaximumNumberOfAttendeesByTime(programItems);
  getDemandByTime(signupsByTime, maximumNumberOfAttendeesByTime);
};
