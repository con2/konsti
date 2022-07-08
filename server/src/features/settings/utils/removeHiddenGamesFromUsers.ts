import { delSignupsByGameIds } from "server/features/signup/signupRepository";
import {
  findUsers,
  updateUserByUsername,
} from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { Game } from "shared/typings/models/game";

export const removeHiddenGamesFromUsers = async (
  hiddenGames: readonly Game[]
): Promise<void> => {
  logger.info(`Remove hidden games from users`);

  if (!hiddenGames || hiddenGames.length === 0) return;

  logger.info(`Found ${hiddenGames.length} hidden games`);

  let users;
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(`findUsers error: ${error}`);
    throw error;
  }

  const userPromises = users.map(async (user) => {
    const signedGames = user.signedGames.filter((signedGame) => {
      const hiddenFound = hiddenGames.find((hiddenGame) => {
        return hiddenGame.gameId === signedGame.gameDetails.gameId;
      });
      if (!hiddenFound) {
        return signedGame;
      }
    });

    const favoritedGames = user.favoritedGames.filter((favoritedGame) => {
      const hiddenFound = hiddenGames.find((hiddenGame) => {
        return hiddenGame.gameId === favoritedGame.gameId;
      });
      if (!hiddenFound) {
        return favoritedGame;
      }
    });

    if (
      user.signedGames.length !== signedGames.length ||
      user.favoritedGames.length !== favoritedGames.length
    ) {
      await updateUserByUsername({
        ...user,
        signedGames,
        favoritedGames,
      });
    }
  });

  try {
    await Promise.all(userPromises);
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
  }

  const hiddenGameIds = hiddenGames.map((hiddenGame) => hiddenGame.gameId);
  try {
    await delSignupsByGameIds(hiddenGameIds);
  } catch (error) {
    logger.error(`delSignupsByGameIds error: ${error}`);
  }

  logger.info(`Hidden games removed from users`);
};
