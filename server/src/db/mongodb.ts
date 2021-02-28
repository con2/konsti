import mongoose from 'mongoose';
import { logger } from 'server/utils/logger';
import { config } from 'server/config';
import { user } from 'server/db/user/userService';
import { feedback } from 'server/db/feedback/feedbackService';
import { game } from 'server/db/game/gameService';
import { results } from 'server/db/results/resultsService';
import { settings } from 'server/db/settings/settingsService';
import { serial } from 'server/db/serial/serialService';

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

// If the Node process ends, close the Mongoose connection
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGINT', gracefulExit);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGTERM', gracefulExit);

export const db = {
  connectToDb,
  gracefulExit,
  user,
  feedback,
  game,
  results,
  settings,
  serial,
};
