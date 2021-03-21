import { logger } from 'server/utils/logger';
import { db } from 'server/db/mongodb';
import { Status } from 'shared/typings/api/games';
import { Game } from 'shared/typings/models/game';

interface GetSettingsResponse {
  message: string;
  status: Status;
  error?: Error;
  hiddenGames?: readonly Game[];
  signupTime?: string;
  appOpen?: boolean;
}

// Get settings
export const getSettings = async (): Promise<GetSettingsResponse> => {
  logger.info('API call: GET /api/settings');

  try {
    const response = await db.settings.findSettings();

    return {
      message: 'Getting settings success',
      status: 'success',
      hiddenGames: response.hiddenGames,
      signupTime: response.signupTime || '',
      appOpen: response.appOpen,
    };
  } catch (error) {
    logger.error(`Settings: ${error}`);
    return {
      message: 'Getting settings failed',
      status: 'error',
      error,
    };
  }
};
