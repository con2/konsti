import { postHidden } from 'client/services/hiddenServices';
import {
  getSettings,
  postToggleAppOpen,
} from 'client/services/settingsServices';
import { postSignupTime } from 'client/services/signuptimeServices';
import { Game } from 'shared/typings/models/game';
import { AppThunk } from 'client/typings/redux.typings';
import {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitSignupTimeAsync,
  submitToggleAppOpenAsync,
} from 'client/views/admin/adminSlice';

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
      dispatch(submitSignupTimeAsync(signupTimeResponse.signupTime));
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
