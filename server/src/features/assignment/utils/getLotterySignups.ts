import { logger } from "server/utils/logger";
import { LotterySignup } from "server/types/userTypes";
import { User } from "shared/types/models/user";

export const getLotterySignups = (
  attendees: readonly User[],
): LotterySignup[] => {
  logger.debug("Get lottery signups");
  const lotterySignups: LotterySignup[] = [];

  // Get lottery signups for all attendees
  attendees.forEach((attendee) => {
    if (attendee.lotterySignups.length !== 0) {
      attendee.lotterySignups.forEach((lotterySignup) => {
        lotterySignups.push({
          username: attendee.username,
          programItemId: lotterySignup.programItem.programItemId,
          priority: lotterySignup.priority,
        });
      });
    }
  });

  logger.debug(`Found ${lotterySignups.length} lottery signups`);

  return lotterySignups;
};
