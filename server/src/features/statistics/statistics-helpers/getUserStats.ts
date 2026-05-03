import fs from "node:fs";
import { getUsersWithoutSignups } from "./userDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { User } from "shared/types/models/user";

export const getUserStats = (event: string, year: number): void => {
  const users = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  ) as User[];

  logger.info(`Loaded ${users.length} users`);

  getUsersWithoutSignups(users);
};
