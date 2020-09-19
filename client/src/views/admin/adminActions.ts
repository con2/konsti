import { postHidden } from 'services/hiddenServices';
import { getSettings, postToggleAppOpen } from 'services/settingsServices';
import { postSignupTime } from 'services/signuptimeServices';
import { Game } from 'typings/game.typings';
import { Settings } from 'typings/settings.typings';
import { AppThunk } from 'typings/utils.typings';
import {
  SubmitUpdateHiddenAsync,
  SubmitGetSettingsAsync,
  SubmitSignupTimeAsync,
  SubmitSetTestTime,
  SubmitToggleAppOpenAsync,
  SubmitResponseMessageAsync,
  SUBMIT_UPDATE_HIDDEN,
  SUBMIT_GET_SETTINGS,
  SUBMIT_SELECT_SIGNUP_TIME,
  SUBMIT_SET_TEST_TIME,
  SUBMIT_TOGGLE_APP_OPEN,
  SUBMIT_RESPONSE_MESSAGE,
} from 'typings/adminActions.typings';

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

const submitUpdateHiddenAsync = (
  hiddenGames: readonly Game[]
): SubmitUpdateHiddenAsync => {
  return {
    type: SUBMIT_UPDATE_HIDDEN,
    hiddenGames,
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

const submitGetSettingsAsync = ({
  hiddenGames,
  signupTime,
  appOpen,
}: Settings): SubmitGetSettingsAsync => {
  return {
    type: SUBMIT_GET_SETTINGS,
    hiddenGames,
    signupTime,
    appOpen,
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

const submitSignupTimeAsync = (signupTime: string): SubmitSignupTimeAsync => {
  return {
    type: SUBMIT_SELECT_SIGNUP_TIME,
    signupTime,
  };
};

export const submitSetTestTime = (testTime: string): SubmitSetTestTime => {
  return {
    type: SUBMIT_SET_TEST_TIME,
    testTime,
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

const submitToggleAppOpenAsync = (
  appOpen: boolean
): SubmitToggleAppOpenAsync => {
  return {
    type: SUBMIT_TOGGLE_APP_OPEN,
    appOpen,
  };
};

export const submitResponseMessageAsync = (
  responseMessage: string
): SubmitResponseMessageAsync => {
  return {
    type: SUBMIT_RESPONSE_MESSAGE,
    responseMessage,
  };
};
