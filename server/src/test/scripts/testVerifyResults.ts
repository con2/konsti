import { logger } from "server/utils/logger";
import { verifyUserSignups } from "server/features/assignment/run-assignment/runAssignmentTestUtils";
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

try {
  await testVerifyResults();
} catch (error: unknown) {
  logger.error(error);
}
