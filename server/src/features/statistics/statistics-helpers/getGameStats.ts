import fs from "fs";
import {
  getGamesByStartTime,
  getNumberOfFullGames,
  getDemandByTime,
  getDemandByGame,
} from "./gameDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { Game } from "shared/types/models/game";
import { User } from "shared/types/models/user";

export const getGameStats = (year: number, event: string): void => {
  const games: Game[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/games.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${games.length} games`);

  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${games.length} users`);

  getGamesByStartTime(games);
  getNumberOfFullGames(games, users);
  getDemandByTime(games, users);
  getDemandByGame(games, users);
};
