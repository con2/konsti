import {
  findSettings,
  saveSignupTime,
  saveToggleAppOpen,
  saveHidden,
} from 'server/features/settings/settingsRepository';
import { logger } from 'server/utils/logger';
import { ServerError } from 'shared/typings/api/errors';
import {
  GetSettingsResponse,
  PostHiddenResponse,
  PostToggleAppOpenResponse,
} from 'shared/typings/api/settings';
import { PostSignupTimeResponse } from 'shared/typings/api/signup';
import { Game } from 'shared/typings/models/game';
import { removeHiddenGamesFromUsers } from 'server/features/settings/settingsUtils';

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

export const storeSignupTime = async (
  signupTime: string
): Promise<PostSignupTimeResponse | ServerError> => {
  try {
    const response = await saveSignupTime(signupTime);
    return {
      message: 'Signup time set success',
      status: 'success',
      signupTime: response.signupTime,
    };
  } catch (error) {
    return {
      message: 'Signup time set failure',
      status: 'error',
      code: 0,
    };
  }
};

export const storeHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ServerError> => {
  let settings;
  try {
    settings = await saveHidden(hiddenData);
  } catch (error) {
    logger.error(`saveHidden error: ${error}`);
    return {
      message: 'Update hidden failure',
      status: 'error',
      code: 0,
    };
  }

  try {
    await removeHiddenGamesFromUsers(settings.hiddenGames);
  } catch (error) {
    logger.error(`removeHiddenGamesFromUsers error: ${error}`);
    return {
      message: 'Update hidden failure',
      status: 'error',
      code: 0,
    };
  }

  return {
    message: 'Update hidden success',
    status: 'success',
    hiddenGames: settings.hiddenGames,
  };
};
