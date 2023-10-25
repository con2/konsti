import fs from "fs";
import {
  getUsersWithoutGames,
  getUsersWithoutSignups,
  getUsersSignupCount,
  getUsersWithAllGames,
} from "./userDataHelpers";
import { logger } from "server/utils/logger";
import { getServerConfig } from "server/serverConfig";
import { User } from "shared/typings/models/user";

export const getUserStats = (year: number, event: string): void => {
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${getServerConfig().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${users.length} users`);

  getUsersWithoutSignups(users);
  const usersWithoutGames = getUsersWithoutGames(users);
  getUsersSignupCount(usersWithoutGames);
  getUsersWithAllGames(users);
};
