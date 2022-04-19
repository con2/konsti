import { findUsers, updateUser } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";

export const removeInvalidGamesFromUsers = async (): Promise<void> => {
  logger.info("Remove invalid games from users");

  let users;
  try {
    users = await findUsers();
  } catch (error) {
    logger.error(`findUsers error: ${error}`);
    throw error;
  }

  try {
    await Promise.all(
      users.map(async (user) => {
        const validSignedGames = user.signedGames.filter((signedGame) => {
          if (signedGame.gameDetails !== null) {
            return signedGame.gameDetails;
          }
        });

        const changedSignedGamesCount =
          user.signedGames.length - validSignedGames.length;

        if (changedSignedGamesCount > 0) {
          logger.info(
            `Remove ${changedSignedGamesCount} invalid signedGames from user ${user.username}`
          );
        }

        const validEnteredGames = user.enteredGames.filter((enteredGame) => {
          if (enteredGame.gameDetails !== null) {
            return enteredGame.gameDetails;
          }
        });

        const changedEnteredGamesCount =
          user.enteredGames.length - validEnteredGames.length;

        if (changedEnteredGamesCount > 0) {
          logger.info(
            `Remove ${changedEnteredGamesCount} invalid enteredGames from user ${user.username}`
          );
        }

        const validFavoritedGames = user.favoritedGames.filter(
          (favoritedGame) => {
            if (favoritedGame !== null) {
              return favoritedGame;
            }
          }
        );

        const changedFavoritedGamesCount =
          user.favoritedGames.length - validFavoritedGames.length;

        if (changedFavoritedGamesCount > 0) {
          logger.info(
            `Remove ${changedFavoritedGamesCount} invalid favoritedGames from user ${user.username}`
          );
        }

        if (
          changedSignedGamesCount > 0 ||
          changedEnteredGamesCount > 0 ||
          changedFavoritedGamesCount > 0
        ) {
          await updateUser({
            ...user,
            signedGames: validSignedGames,
            enteredGames: validEnteredGames,
            favoritedGames: validFavoritedGames,
          });
        }
      })
    );
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
    throw error;
  }
};
