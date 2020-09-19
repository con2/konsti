import { db } from 'db/mongodb';
import { logger } from 'utils/logger';
import { removeInvalidSignupsFromUsers } from 'player-assignment/utils/removeInvalidSignupsFromUsers';

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
