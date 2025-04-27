import { logger } from "server/utils/logger";
import { LotterySignup } from "server/types/userTypes";
import { User } from "shared/types/models/user";

export const getLotterySignups = (users: readonly User[]): LotterySignup[] => {
  logger.debug("Get lottery signups");
  const lotterySignups: LotterySignup[] = [];

  // Get lottery signups for all users
  for (const user of users) {
    if (user.lotterySignups.length > 0) {
      for (const lotterySignup of user.lotterySignups) {
        lotterySignups.push({
          username: user.username,
          programItemId: lotterySignup.programItemId,
          priority: lotterySignup.priority,
          startTime: lotterySignup.time,
        });
      }
    }
  }

  logger.debug(`Found ${lotterySignups.length} lottery signups`);

  return lotterySignups;
};
