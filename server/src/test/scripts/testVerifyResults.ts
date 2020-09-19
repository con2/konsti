import { db } from 'db/mongodb';
import { logger } from 'utils/logger';
import { verifyResults } from 'player-assignment/test/utils/verifyResults';
import { verifyUserSignups } from 'player-assignment/test/utils/verifyUserSignups';

const testVerifyResults = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(error);
  }

  try {
    await verifyResults();
  } catch (error) {
    logger.error(error);
  }

  try {
    await verifyUserSignups();
  } catch (error) {
    logger.error(error);
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(error);
  }
};

testVerifyResults().catch((error) => {
  logger.error(error);
});
