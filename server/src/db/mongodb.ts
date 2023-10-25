import mongoose from "mongoose";
import { logger } from "server/utils/logger";
import { serverConfig } from "server/serverConfig";

const connectToDb = async (
  dbConnString: string = serverConfig.dbConnString,
  dbName: string = serverConfig.dbName,
): Promise<void> => {
  logger.info(`MongoDB: Connecting`);

  const options = {
    dbName,
  };

  try {
    await mongoose.connect(dbConnString, options);
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax -- Server startup
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
    // eslint-disable-next-line no-restricted-syntax -- Server startup
    throw new Error(`MongoDB: Error shutting down db connection: ${error}`);
  }

  logger.info(`MongoDB connection closed`);
};

export const db = {
  connectToDb,
  gracefulExit,
};
