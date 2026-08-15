import { User } from "shared/types/models/user";
import { AssignmentLotterySignup } from "server/types/userTypes";
import { logger } from "server/utils/logger";

export const getLotterySignups = (
  users: readonly User[],
): AssignmentLotterySignup[] => {
  logger.debug("Get lottery signups");
  const lotterySignups: AssignmentLotterySignup[] = [];

  // Get lottery sign-ups for all users
  for (const user of users) {
    if (user.lotterySignups.length > 0) {
      for (const lotterySignup of user.lotterySignups) {
        lotterySignups.push({
          username: user.username,
          programItemId: lotterySignup.programItemId,
          priority: lotterySignup.priority,
          signedToStartTime: lotterySignup.signedToStartTime,
        });
      }
    }
  }

  logger.debug(`Found ${lotterySignups.length} lottery signups`);

  return lotterySignups;
};
