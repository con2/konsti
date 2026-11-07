import { db } from "server/db/mongodb";
import { verifyUserSignups } from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import { logger } from "server/utils/logger";

const testVerifyResults = async (): Promise<void> => {
  try {
    await db.connectToDb();
  } catch (error) {
    logger.error(new Error("Failed to connect to DB", { cause: error }));
  }

  try {
    await verifyUserSignups();
  } catch (error) {
    logger.error(new Error("Failed to verify user sign-ups", { cause: error }));
  }

  try {
    await db.gracefulExit();
  } catch (error) {
    logger.error(new Error("Failed to close DB connection", { cause: error }));
  }
};

try {
  await testVerifyResults();
} catch (error: unknown) {
  logger.error(new Error("Failed to verify results", { cause: error }));
}
