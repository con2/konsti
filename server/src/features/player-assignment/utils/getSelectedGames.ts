import { logger } from "server/utils/logger";
import { Game } from "shared/types/models/game";
import { SignupWish } from "server/types/userTypes";

export const getSelectedGames = (
  startingGames: readonly Game[],
  signupWishes: readonly SignupWish[],
): Game[] => {
  logger.debug("Get selected games");
  const selectedGames = [] as Game[];
  let minAttendance = 0;
  let maxAttendance = 0;

  // Get valid games from games that are starting and games that have wishes
  startingGames.forEach((startingGame) => {
    for (let i = 0; i < signupWishes.length; i += 1) {
      if (startingGame.gameId === signupWishes[i].gameId) {
        selectedGames.push(startingGame);
        minAttendance += startingGame.minAttendance;
        maxAttendance += startingGame.maxAttendance;
        break;
      }
    }
  });

  logger.debug(
    `Found ${selectedGames.length} games that have signup wishes and ${minAttendance}-${maxAttendance} available seats`,
  );

  return selectedGames;
};
