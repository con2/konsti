import { logger } from "server/utils/logger";
import { User } from "shared/types/models/user";
import { toPercent } from "server/features/statistics/statsUtil";

export const getUsersWithoutSignups = (
  users: readonly User[],
): readonly User[] => {
  let counter = 0;
  const usersWithoutSignups: User[] = [];
  for (const user of users) {
    if (user.lotterySignups.length === 0) {
      usersWithoutSignups.push(user);
      counter += 1;
    }
  }

  logger.info(
    `Attendees without any lottery signups: ${counter}/${users.length} (${toPercent(
      counter / users.length,
    )}%)`,
  );

  return usersWithoutSignups;
};
