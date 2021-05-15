import _ from 'lodash';
import { findGames } from 'server/features/game/gameRepository';
import { GameModel } from 'server/features/game/gameSchema';
import { removeInvalidSignupsFromUsers } from 'server/features/player-assignment/utils/removeInvalidSignupsFromUsers';
import { GameDoc } from 'server/typings/game.typings';
import { logger } from 'server/utils/logger';
import { Game } from 'shared/typings/models/game';

export const removeDeletedGames = async (
  updatedGames: readonly Game[]
): Promise<void> => {
  const currentGames = await findGames();

  const deletedGames = _.differenceBy(currentGames, updatedGames, 'gameId');

  if (deletedGames && deletedGames.length !== 0) {
    logger.info(`Found ${deletedGames.length} deleted games, remove...`);

    try {
      await Promise.all(
        deletedGames.map(async (deletedGame) => {
          await GameModel.deleteOne({ gameId: deletedGame.gameId });
        })
      );
    } catch (error) {
      logger.error(`Error removing deleted games: ${error}`);
      return await Promise.reject(error);
    }

    await removeInvalidSignupsFromUsers();
  }
};

export const getGameById = async (gameId: string): Promise<GameDoc> => {
  let games: GameDoc[];
  try {
    games = await findGames();
  } catch (error) {
    logger.error(`MongoDB: Error loading games - ${error}`);
    return error;
  }

  const foundGame = games.find((game) => game.gameId === gameId);

  if (!foundGame) throw new Error(`Game ${gameId} not found`);

  return foundGame;
};
