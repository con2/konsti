import fs from "fs";
import {
  getProgramItemsByStartTime,
  getNumberOfFullProgramItems,
  getDemandByTime,
  getDemandByProgramItem,
} from "./programItemDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";

export const getProgramItemStats = (year: number, event: string): void => {
  const programItems: ProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} program items`);

  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} users`);

  getProgramItemsByStartTime(programItems);
  getNumberOfFullProgramItems(programItems, users);
  getDemandByTime(programItems, users);
  getDemandByProgramItem(programItems, users);
};
