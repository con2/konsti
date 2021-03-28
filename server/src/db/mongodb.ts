import mongoose from 'mongoose';
import { logger } from 'server/utils/logger';
import { config } from 'server/config';

const connectToDb = async (
  dbConnString: string = config.dbConnString
): Promise<void> => {
  const { dbName } = config;

  logger.info(`MongoDB: Connecting`);

  const options = {
    promiseLibrary: global.Promise,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: dbName,
    useFindAndModify: false,
  };

  try {
    await mongoose.connect(dbConnString, options);
  } catch (error) {
    throw new Error(`MongoDB: Error connecting to DB: ${error}`);
  }

  logger.info(`MongoDB: Connection successful`);

  mongoose.connection.on('error', (error) => {
    logger.error(error);
  });
};

const gracefulExit = async (
  dbConnString: string = config.dbConnString
): Promise<void> => {
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
