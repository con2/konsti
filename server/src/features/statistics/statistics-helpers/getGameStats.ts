import fs from "fs";
import {
  getGamesByStartingTime,
  getNumberOfFullGames,
  getDemandByTime,
  getDemandByGame,
} from "./gameDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "server/config";

export const getGameStats = (year: number, event: string): void => {
  const games = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/games.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${games.length} games`);

  const users = JSON.parse(
    fs.readFileSync(
      `${config.statsDataDir}/${event}/${year}/users.json`,
      "utf8"
    )
  );

  logger.info(`Loaded ${games.length} users`);

  getGamesByStartingTime(games);
  getNumberOfFullGames(games, users);
  getDemandByTime(games, users);
  getDemandByGame(games, users);
};
