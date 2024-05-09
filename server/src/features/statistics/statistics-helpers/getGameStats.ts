import fs from "fs";
import {
  getGamesByStartTime,
  getNumberOfFullGames,
  getDemandByTime,
  getDemandByGame,
} from "./gameDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ProgramItem } from "shared/types/models/programItem";
import { User } from "shared/types/models/user";

export const getGameStats = (year: number, event: string): void => {
  const programItems: ProgramItem[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/program-items.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} games`);

  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${programItems.length} users`);

  getGamesByStartTime(programItems);
  getNumberOfFullGames(programItems, users);
  getDemandByTime(programItems, users);
  getDemandByGame(programItems, users);
};
