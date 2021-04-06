import { findSettings } from 'server/features/settings/settingsRepository';
import { logger } from 'server/utils/logger';
import { ServerError } from 'shared/typings/api/errors';
import { GetSettingsResponse } from 'shared/typings/api/settings';

export const fetchSettings = async (): Promise<
  GetSettingsResponse | ServerError
> => {
  try {
    const response = await findSettings();

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
      code: 0,
    };
  }
};
