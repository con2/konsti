import fs from "node:fs";
import {
  getUsersWithoutProgramItems,
  getUsersWithoutSignups,
  getUsersSignupCount,
  getUsersWithAllProgramItems,
} from "./userDataHelpers";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { User } from "shared/types/models/user";

export const getUserStats = (event: string, year: number): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const users: User[] = JSON.parse(
    fs.readFileSync(
      `${config.server().statsDataDir}/${event}/${year}/users.json`,
      "utf8",
    ),
  );

  logger.info(`Loaded ${users.length} users`);

  getUsersWithoutSignups(users);
  const usersWithoutProgramItems = getUsersWithoutProgramItems(users);
  getUsersSignupCount(usersWithoutProgramItems);
  getUsersWithAllProgramItems(users);
};
