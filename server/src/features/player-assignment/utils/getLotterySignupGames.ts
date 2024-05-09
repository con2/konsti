import { logger } from "server/utils/logger";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupWish } from "server/types/userTypes";

export const getLotterySignupGames = (
  startingGames: readonly ProgramItem[],
  signupWishes: readonly SignupWish[],
): ProgramItem[] => {
  logger.debug("Get selected games");
  const lotterySignupGames = [] as ProgramItem[];
  let minAttendance = 0;
  let maxAttendance = 0;

  // Get valid games from games that are starting and games that have lottery signups
  startingGames.forEach((startingGame) => {
    for (let i = 0; i < signupWishes.length; i += 1) {
      if (startingGame.gameId === signupWishes[i].gameId) {
        lotterySignupGames.push(startingGame);
        minAttendance += startingGame.minAttendance;
        maxAttendance += startingGame.maxAttendance;
        break;
      }
    }
  });

  logger.debug(
    `Found ${lotterySignupGames.length} games that have signup wishes and ${minAttendance}-${maxAttendance} available seats`,
  );

  return lotterySignupGames;
};
