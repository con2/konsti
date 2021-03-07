import { Application } from 'express';
import { db } from 'server/db/mongodb';
import { logger } from 'server/utils/logger';

export const closeServer = async (
  server: Application,
  dbConnString: string
): Promise<void> => {
  try {
    await db.gracefulExit(dbConnString);
  } catch (error) {
    logger.error(error);
  }
};
