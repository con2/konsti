import { saveToggleAppOpen } from 'server/features/settings/settingsRepository';
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
