import mongoose from "mongoose";
import { db } from "server/db/mongodb";
import { logger } from "server/utils/logger";

const closeOpenConnection = async (): Promise<void> => {
  if (
    mongoose.connection.readyState === mongoose.ConnectionStates.disconnected
  ) {
    return;
  }
  try {
    await db.gracefulExit();
  } catch (error: unknown) {
    logger.error(new Error("Failed to close DB connection", { cause: error }));
    process.exitCode = 1;
  }
};

// Runs a script's entry point so a failure exits with status 1. The DB connection is closed
// either way, since an open one keeps the process alive after a failure.
export const runScript = async (
  failureMessage: string,
  run: () => Promise<void>,
): Promise<void> => {
  try {
    await run();
  } catch (error: unknown) {
    logger.error(new Error(failureMessage, { cause: error }));
    process.exitCode = 1;
  } finally {
    await closeOpenConnection();
  }
};
