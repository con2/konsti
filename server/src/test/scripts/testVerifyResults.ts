import { logger } from "server/utils/logger";
import { verifyUserSignups } from "server/features/player-assignment/utils/verifyUserSignups";
import { db } from "server/db/mongodb";

const testVerifyResults = async (): Promise<void> => {
  try {
    await db.connectToDb();
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
