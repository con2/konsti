import { logger } from 'server/utils/logger';
import { removeInvalidSignupsFromUsers } from 'server/player-assignment/utils/removeInvalidSignupsFromUsers';
import { db } from 'server/db/mongodb';

const removeInvalidGames = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }

  try {
    await removeInvalidSignupsFromUsers();
  } catch (error) {
    logger.error(`Error removing invalid games: ${error}`);
    throw new Error(error);
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }
};

removeInvalidGames().catch((error) => {
  logger.error(error);
});
