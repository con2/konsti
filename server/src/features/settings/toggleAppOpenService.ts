import { saveToggleAppOpen } from 'server/features/settings/settingsRepository';
import { ServerError } from 'shared/typings/api/errors';
import { PostToggleAppOpenResponse } from 'shared/typings/api/settings';

export const toggleAppOpen = async (
  appOpen: boolean
): Promise<PostToggleAppOpenResponse | ServerError> => {
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
      code: 0,
    };
  }
};
