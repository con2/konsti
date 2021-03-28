import { saveToggleAppOpen } from 'server/db/settings/settingsService';
import { logger } from 'server/utils/logger';
import { Status } from 'shared/typings/api/games';

interface ToggleAppOpenResponse {
  message: string;
  status: Status;
  appOpen?: boolean;
  error?: Error;
}

export const toggleAppOpen = async (
  appOpen: boolean
): Promise<ToggleAppOpenResponse> => {
  logger.info('API call: POST /api/toggle-app-open');

  try {
    const response = await saveToggleAppOpen(appOpen);
    return {
      message: 'Update app open success',
      status: 'success',
      appOpen: response.appOpen,
    };
  } catch (error) {
    return {
      message: 'Update app open failure',
      status: 'error',
      error,
    };
  }
};
