import { Request, Response } from 'express';
import { logger } from 'server/utils/logger';
import { db } from 'server/db/mongodb';

// Get settings
const getSettings = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: GET /api/settings');

  try {
    const response = await db.settings.findSettings();

    return res.json({
      message: 'Getting settings success',
      status: 'success',
      hiddenGames: response.hiddenGames,
      signupTime: response.signupTime || '',
      appOpen: response.appOpen,
    });
  } catch (error) {
    logger.error(`Settings: ${error}`);
    return res.json({
      message: 'Getting settings failed',
      status: 'error',
      error,
    });
  }
};

export { getSettings };
