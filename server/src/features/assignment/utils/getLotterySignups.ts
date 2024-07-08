import { logger } from "server/utils/logger";
import { LotterySignup } from "server/types/userTypes";
import { User } from "shared/types/models/user";

export const getLotterySignups = (users: readonly User[]): LotterySignup[] => {
  logger.debug("Get lottery signups");
  const lotterySignups: LotterySignup[] = [];

  // Get lottery signups for all attendees
  users.forEach((user) => {
    if (user.lotterySignups.length !== 0) {
      user.lotterySignups.forEach((lotterySignup) => {
        lotterySignups.push({
          username: user.username,
          programItemId: lotterySignup.programItem.programItemId,
          priority: lotterySignup.priority,
        });
      });
    }
  });

  logger.debug(`Found ${lotterySignups.length} lottery signups`);

  return lotterySignups;
};
