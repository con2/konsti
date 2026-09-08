import fs from "node:fs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  printDirectSignupFillTimes,
  printProgramItemSignups,
} from "server/features/statistics/statistics-helpers/directSignupDataHelpers";
import { logger } from "server/utils/logger";

export const getDirectSignupStats = (event: string, year: number): void => {
  // Ropecon 2026 was the first event to record the sign-up moment, and the
  // dumps before it carry a backfilled signupTime
  if (year < 2026) {
    logger.error(
      new Error(
        `${event} ${year} predates recorded sign-up times, so its fill times cannot be computed`,
      ),
    );
    return;
  }

  const directSignups = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/direct-signups.json`,
      "utf8",
    ),
  ) as DirectSignupsForProgramItem[];

  const programItems = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  ) as ProgramItem[];

  logger.info(`Loaded ${directSignups.length} direct signups`);

  printDirectSignupFillTimes(directSignups, programItems);

  printProgramItemSignups(directSignups, programItems);
};
