import { db } from "server/db/mongodb";
import { verifyUserSignups } from "server/features/assignment/run-assignment/runAssignmentTestUtils";
import { logger } from "server/utils/logger";

const testVerifyResults = async (): Promise<void> => {
  await db.connectToDb();
  await verifyUserSignups();
  await db.gracefulExit();
};

try {
  await testVerifyResults();
} catch (error: unknown) {
  logger.error(new Error("Failed to verify results", { cause: error }));
  process.exitCode = 1;
  await db.gracefulExit();
}
