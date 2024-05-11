import { logger } from "server/utils/logger";
import { LotterySignup } from "server/types/userTypes";
import { User } from "shared/types/models/user";

export const getLotterySignups = (
  players: readonly User[],
): LotterySignup[] => {
  logger.debug("Get lottery signups");
  const lotterySignups: LotterySignup[] = [];

  // Get lottery signups for all players
  players.forEach((player) => {
    if (player.lotterySignups.length !== 0) {
      player.lotterySignups.forEach((lotterySignup) => {
        lotterySignups.push({
          username: player.username,
          programItemId: lotterySignup.programItem.programItemId,
          priority: lotterySignup.priority,
        });
      });
    }
  });

  logger.debug(`Found ${lotterySignups.length} lottery signups`);

  return lotterySignups;
};
