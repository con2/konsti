import fs from "node:fs";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";
import { logger } from "server/utils/logger";
import {
  getDemandByProgramItem,
  getDemandByTime,
  getProgramItemsByStartTime,
} from "./programItemDataHelpers";

export const getProgramItemStats = (event: string, year: number): void => {
  const programItems = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  ) as ProgramItem[];

  logger.info(`Loaded ${programItems.length} program items`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} users`);

  getProgramItemsByStartTime(programItems);
  getDemandByTime(programItems, users);
  getDemandByProgramItem(programItems, users);
};
