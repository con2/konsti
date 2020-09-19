import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateAuthHeader } from 'utils/authHeader';
import { Request, Response } from 'express';
import { Game } from 'typings/game.typings';
import { UserGroup } from 'typings/user.typings';

// Add hidden data to server settings
const postHidden = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: POST /api/hidden');
  const hiddenData = req.body.hiddenData;

  const validToken = validateAuthHeader(
    req.headers.authorization,
    UserGroup.admin
  );

  if (!validToken) {
    return res.sendStatus(401);
  }

  let settings;
  try {
    settings = await db.settings.saveHidden(hiddenData);
  } catch (error) {
    logger.error(`db.settings.saveHidden error: ${error}`);
    return res.json({
      message: 'Update hidden failure',
      status: 'error',
      error,
    });
  }

  try {
    await removeHiddenGamesFromUsers(settings.hiddenGames);
  } catch (error) {
    logger.error(`removeHiddenGamesFromUsers error: ${error}`);
    return res.json({
      message: 'Update hidden failure',
      status: 'error',
      error,
    });
  }

  return res.json({
    message: 'Update hidden success',
    status: 'success',
    hiddenGames: settings.hiddenGames,
  });
};

const removeHiddenGamesFromUsers = async (
  hiddenGames: readonly Game[]
): Promise<void> => {
  logger.info(`Remove hidden games from users`);

  if (!hiddenGames || hiddenGames.length === 0) return;

  logger.info(`Found ${hiddenGames.length} hidden games`);

  let users;
  try {
    users = await db.user.findUsers();
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
          await db.user.updateUser({
            ...user,
            signedGames,
            enteredGames,
            favoritedGames,
          });
        }
      })
    );
  } catch (error) {
    logger.error(`db.user.updateUser error: ${error}`);
  }

  logger.info(`Hidden games removed from users`);
};

export { postHidden };
