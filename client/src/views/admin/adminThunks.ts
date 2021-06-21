import { postHidden } from 'client/services/hiddenServices';
import {
  deleteSignupMessage,
  getSettings,
  postSignupMessage,
  postToggleAppOpen,
} from 'client/services/settingsServices';
import { postSignupTime } from 'client/services/signuptimeServices';
import { Game } from 'shared/typings/models/game';
import { AppThunk } from 'client/typings/redux.typings';
import {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitActiveSignupTimeAsync,
  submitToggleAppOpenAsync,
  updateSignupMessages,
} from 'client/views/admin/adminSlice';
import { SignupMessage } from 'shared/typings/models/settings';

export const submitUpdateHidden = (hiddenGames: readonly Game[]): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateHiddenResponse = await postHidden(hiddenGames);

    if (updateHiddenResponse?.status === 'error') {
      return await Promise.reject(updateHiddenResponse);
    }

    if (updateHiddenResponse?.status === 'success') {
      dispatch(submitUpdateHiddenAsync(updateHiddenResponse.hiddenGames));
    }
  };
};

export const submitGetSettings = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const settingsResponse = await getSettings();

    if (settingsResponse?.status === 'error') {
      return await Promise.reject(settingsResponse);
    }

    if (settingsResponse?.status === 'success') {
      dispatch(
        submitGetSettingsAsync({
          hiddenGames: settingsResponse.hiddenGames,
          signupTime: settingsResponse.signupTime,
          appOpen: settingsResponse.appOpen,
          signupMessages: settingsResponse.signupMessages,
        })
      );
    }
  };
};

export const submitSignupTime = (signupTime: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const signupTimeResponse = await postSignupTime(signupTime);

    if (signupTimeResponse?.status === 'error') {
      return await Promise.reject(signupTimeResponse);
    }

    if (signupTimeResponse?.status === 'success') {
      dispatch(submitActiveSignupTimeAsync(signupTimeResponse.signupTime));
    }
  };
};

export const submitToggleAppOpen = (appOpen: boolean): AppThunk => {
  return async (dispatch): Promise<void> => {
    const appOpenResponse = await postToggleAppOpen(appOpen);

    if (appOpenResponse?.status === 'error') {
      return await Promise.reject(appOpenResponse);
    }

    if (appOpenResponse?.status === 'success') {
      dispatch(submitToggleAppOpenAsync(appOpenResponse.appOpen));
    }
  };
};

export const submitAddSignupMessage = (
  signupMessage: SignupMessage
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSignupMessage({
      gameId: signupMessage.gameId,
      message: signupMessage.message,
    });

    if (response?.status === 'error') {
      return await Promise.reject(response);
    }

    if (response?.status === 'success') {
      dispatch(updateSignupMessages(response.signupMessages));
    }
  };
};

export const submitDeleteSignupMessage = (gameId: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await deleteSignupMessage(gameId);

    if (response?.status === 'error') {
      return await Promise.reject(response);
    }

    if (response?.status === 'success') {
      dispatch(updateSignupMessages(response.signupMessages));
    }
  };
};
