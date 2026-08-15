import fs from "node:fs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";
import {
  printProgramItemSignups,
  printRpgDirectSignupFullTimes,
} from "server/features/statistics/statistics-helpers/directSignupDataHelpers";
import { logger } from "server/utils/logger";

export const getDirectSignupStats = (event: string, year: number): void => {
  const directSignups = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/direct-signups.json`,
      "utf8",
    ),
  ) as (DirectSignupsForProgramItem & { updatedAt: string })[];

  const programItems = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  ) as ProgramItem[];

  logger.info(`Loaded ${directSignups.length} direct signups`);

  printRpgDirectSignupFullTimes(directSignups, programItems);

  printProgramItemSignups(directSignups, programItems);
};
