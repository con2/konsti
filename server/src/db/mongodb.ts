import mongoose from "mongoose";
import { config } from "shared/config";
import { logger } from "server/utils/logger";

const connectToDb = async (
  dbConnString: string = config.server().dbConnString,
  dbName: string = config.server().dbName,
): Promise<void> => {
  logger.info(`MongoDB: Connecting to DB ${dbName}`);

  const options = {
    dbName,
  };

  try {
    await mongoose.connect(dbConnString, options);
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error("MongoDB: Error connecting to DB", { cause: error });
  }

  logger.info("MongoDB: Connection successful");

  // Build schema indexes for the database just connected to. Mongoose's
  // automatic index build runs once per model per process, so a later
  // connection to a different database (every integration test gets its own)
  // would otherwise silently skip them - including the unique keys that keep
  // single-document collections single
  try {
    await Promise.all(
      Object.values(mongoose.models).map(async (model) => {
        await model.createIndexes();
      }),
    );
  } catch (error) {
    // A unique index fails to build when the data already violates it, e.g. a
    // database that collected duplicate settings documents before the unique
    // key existed. Name the cause: the fix is removing the duplicates
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error(
      "MongoDB: Error building indexes, database may hold data that violates them",
      { cause: error },
    );
  }

  mongoose.connection.on("error", (error) => {
    logger.error(new Error("MongoDB: Connection error", { cause: error }));
  });
};

const gracefulExit = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error("MongoDB: Error shutting down db connection", {
      cause: error,
    });
  }

  logger.info("MongoDB connection closed");
};

export const db = {
  connectToDb,
  gracefulExit,
};
