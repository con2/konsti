import { findUsers, updateUser } from 'server/features/user/userRepository';
import { logger } from 'server/utils/logger';
import { Game } from 'shared/typings/models/game';

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
    return await Promise.reject(error);
  }

  try {
    await Promise.all(
      users.map(async (user) => {
        const signedGames = user.signedGames.filter((signedGame) => {
          const hiddenFound = hiddenGames.find((hiddenGame) => {
            return hiddenGame.gameId === signedGame.gameDetails.gameId;
          });
          if (!hiddenFound) {
            return signedGame;
          }
        });

        const enteredGames = user.enteredGames.filter((enteredGame) => {
          const hiddenFound = hiddenGames.find((hiddenGame) => {
            return hiddenGame.gameId === enteredGame.gameDetails.gameId;
          });
          if (!hiddenFound) {
            return enteredGame;
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
          user.enteredGames.length !== enteredGames.length ||
          user.favoritedGames.length !== favoritedGames.length
        ) {
          await updateUser({
            ...user,
            signedGames,
            enteredGames,
            favoritedGames,
          });
        }
      })
    );
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
  }

  logger.info(`Hidden games removed from users`);
};
