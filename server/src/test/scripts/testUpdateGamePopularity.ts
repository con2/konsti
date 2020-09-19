import 'array-flat-polyfill';
import { logger } from 'utils/logger';
import { updateGamePopularity } from 'game-popularity/updateGamePopularity';
import { db } from 'db/mongodb';

const testUpdateGamePopularity = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
  }

  try {
    await updateGamePopularity();
  } catch (error) {
    logger.error(`updateGamePopularity error: ${error}`);
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }
};

testUpdateGamePopularity().catch((error) => {
  logger.error(error);
});
