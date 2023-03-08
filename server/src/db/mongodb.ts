import mongoose from "mongoose";
import { logger } from "server/utils/logger";
import { config } from "server/config";

const connectToDb = async (
  dbConnString: string = config.dbConnString,
  dbName: string = config.dbName
): Promise<void> => {
  logger.info(`MongoDB: Connecting`);

  const options = {
    dbName,
  };

  try {
    await mongoose.connect(dbConnString, options);
  } catch (error) {
    throw new Error(`MongoDB: Error connecting to DB: ${error}`);
  }

  logger.info(`MongoDB: Connection successful`);

  mongoose.connection.on("error", (error) => {
    logger.error(error);
  });
};

const gracefulExit = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    throw new Error(`MongoDB: Error shutting down db connection: ${error}`);
  }

  logger.info(`MongoDB connection closed`);
};

export const db = {
  connectToDb,
  gracefulExit,
};
