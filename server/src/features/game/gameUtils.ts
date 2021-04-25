import _ from 'lodash';
import { findGames } from 'server/features/game/gameRepository';
import { GameModel } from 'server/features/game/gameSchema';
import { removeInvalidSignupsFromUsers } from 'server/features/player-assignment/utils/removeInvalidSignupsFromUsers';
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
