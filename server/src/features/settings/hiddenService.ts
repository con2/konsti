import { logger } from 'server/utils/logger';
import { Game } from 'shared/typings/models/game';
import { saveHidden } from 'server/features/settings/settingsRepository';
import { findUsers, updateUser } from 'server/features/user/userRepository';
import { ServerError } from 'shared/typings/api/errors';
import { PostHiddenResponse } from 'shared/typings/api/settings';

export const storeHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ServerError> => {
  let settings;
  try {
    settings = await saveHidden(hiddenData);
  } catch (error) {
    logger.error(`saveHidden error: ${error}`);
    return {
      message: 'Update hidden failure',
      status: 'error',
      code: 0,
    };
  }

  try {
    await removeHiddenGamesFromUsers(settings.hiddenGames);
  } catch (error) {
    logger.error(`removeHiddenGamesFromUsers error: ${error}`);
    return {
      message: 'Update hidden failure',
      status: 'error',
      code: 0,
    };
  }

  return {
    message: 'Update hidden success',
    status: 'success',
    hiddenGames: settings.hiddenGames,
  };
};

const removeHiddenGamesFromUsers = async (
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
