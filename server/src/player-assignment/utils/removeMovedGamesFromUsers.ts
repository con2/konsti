import moment from 'moment';
import { db } from 'db/mongodb';
import { logger } from 'utils/logger';
import { Game, GameDoc } from 'typings/game.typings';

export const removeMovedGamesFromUsers = async (
  updatedGames: readonly Game[]
): Promise<void> => {
  logger.info('Remove moved games from users');

  let currentGames: GameDoc[] = [];
  try {
    currentGames = await db.game.findGames();
  } catch (error) {
    logger.error(error);
  }

  const movedGames = currentGames.filter((currentGame) => {
    return updatedGames.find((updatedGame) => {
      return (
        currentGame.gameId === updatedGame.gameId &&
        moment(currentGame.startTime).format() !==
          moment(updatedGame.startTime).format()
      );
    });
  });

  if (!movedGames || movedGames.length === 0) return;

  logger.info(`Found ${movedGames.length} moved games`);

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
          const movedFound = movedGames.find((movedGame) => {
            return movedGame.gameId === signedGame.gameDetails.gameId;
          });
          if (!movedFound) {
            return signedGame;
          }
        });

        const enteredGames = user.enteredGames.filter((enteredGame) => {
          const movedFound = movedGames.find((movedGame) => {
            return movedGame.gameId === enteredGame.gameDetails.gameId;
          });
          if (!movedFound) {
            return enteredGame;
          }
        });

        if (
          user.signedGames.length !== signedGames.length ||
          user.enteredGames.length !== enteredGames.length
        ) {
          await db.user.updateUser({
            ...user,
            signedGames,
            enteredGames,
          });
        }
      })
    );
  } catch (error) {
    logger.error(`db.user.updateUser error: ${error}`);
    throw new Error('No assign results');
  }
};
