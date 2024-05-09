import { logger } from "server/utils/logger";
import { SignupWish } from "server/types/userTypes";
import { User } from "shared/types/models/user";

export const getSignupWishes = (players: readonly User[]): SignupWish[] => {
  logger.debug("Get signup wishes");
  const signupWishes: SignupWish[] = [];

  // Get signup wishes for all players
  players.forEach((player) => {
    if (player.lotterySignups.length !== 0) {
      player.lotterySignups.forEach((lotterySignup) => {
        signupWishes.push({
          username: player.username,
          programItemId: lotterySignup.programItemDetails.programItemId,
          priority: lotterySignup.priority,
        });
      });
    }
  });

  logger.debug(`Found ${signupWishes.length} signup wishes`);

  return signupWishes;
};
