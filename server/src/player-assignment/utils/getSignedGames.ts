import { logger } from 'utils/logger';
import { Game } from 'typings/game.typings';
import { SignupWish } from 'typings/user.typings';

export const getSignedGames = (
  startingGames: readonly Game[],
  signupWishes: readonly SignupWish[]
): Game[] => {
  logger.debug('Get selected games');
  const signedGames = [] as Game[];
  let minAttendance = 0;
  let maxAttendance = 0;

  // Get valid games from games that are starting and games that have wishes
  startingGames.forEach((startingGame) => {
    for (let i = 0; i < signupWishes.length; i += 1) {
      if (startingGame.gameId === signupWishes[i].gameId) {
        signedGames.push(startingGame);
        minAttendance += startingGame.minAttendance;
        maxAttendance += startingGame.maxAttendance;
        break;
      }
    }
  });

  logger.debug(
    `Found ${signedGames.length} games that have signup wishes and ${minAttendance}-${maxAttendance} available seats`
  );

  return signedGames;
};
