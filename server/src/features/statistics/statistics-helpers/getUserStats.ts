import fs from "node:fs";
import { config } from "shared/config";
import { User } from "shared/types/models/user";
import { logger } from "server/utils/logger";
import { getUsersWithoutSignups } from "./userDataHelpers";

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
