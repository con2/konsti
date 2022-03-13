import { postHidden } from "client/services/hiddenServices";
import {
  deleteSignupMessage,
  getSettings,
  postSignupMessage,
  postSettings,
} from "client/services/settingsServices";
import { Game } from "shared/typings/models/game";
import { AppThunk } from "client/typings/redux.typings";
import {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitActiveSignupTimeAsync,
  submitToggleAppOpenAsync,
  updateSignupMessages,
  submitSetSignupStrategyAsync,
} from "client/views/admin/adminSlice";
import { SignupMessage } from "shared/typings/models/settings";
import { SignupStrategy } from "shared/config/sharedConfig.types";

export const submitUpdateHidden = (hiddenGames: readonly Game[]): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateHiddenResponse = await postHidden(hiddenGames);

    if (updateHiddenResponse?.status === "error") {
      return await Promise.reject(updateHiddenResponse);
    }

    if (updateHiddenResponse?.status === "success") {
      dispatch(submitUpdateHiddenAsync(updateHiddenResponse.hiddenGames));
    }
  };
};

export const submitGetSettings = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const settingsResponse = await getSettings();

    if (settingsResponse?.status === "error") {
      return await Promise.reject(settingsResponse);
    }

    if (settingsResponse?.status === "success") {
      dispatch(
        submitGetSettingsAsync({
          hiddenGames: settingsResponse.hiddenGames,
          signupTime: settingsResponse.signupTime,
          appOpen: settingsResponse.appOpen,
          signupMessages: settingsResponse.signupMessages,
          signupStrategy: settingsResponse.signupStrategy,
        })
      );
    }
  };
};

export const submitSignupTime = (signupTime: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const postSettingsResponse = await postSettings({ signupTime });

    if (postSettingsResponse?.status === "error") {
      return await Promise.reject(postSettingsResponse);
    }

    if (postSettingsResponse?.status === "success") {
      dispatch(
        submitActiveSignupTimeAsync(postSettingsResponse.settings.signupTime)
      );
    }
  };
};

export const submitToggleAppOpen = (appOpen: boolean): AppThunk => {
  return async (dispatch): Promise<void> => {
    const postSettingsResponse = await postSettings({ appOpen });

    if (postSettingsResponse?.status === "error") {
      return await Promise.reject(postSettings);
    }

    if (postSettingsResponse?.status === "success") {
      dispatch(submitToggleAppOpenAsync(postSettingsResponse.settings.appOpen));
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

    if (response?.status === "error") {
      return await Promise.reject(response);
    }

    if (response?.status === "success") {
      dispatch(updateSignupMessages(response.signupMessages));
    }
  };
};

export const submitDeleteSignupMessage = (gameId: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await deleteSignupMessage(gameId);

    if (response?.status === "error") {
      return await Promise.reject(response);
    }

    if (response?.status === "success") {
      dispatch(updateSignupMessages(response.signupMessages));
    }
  };
};

export const submitSetSignupStrategy = (
  signupStrategy: SignupStrategy
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSettings({ signupStrategy });

    if (response?.status === "error") {
      return await Promise.reject(response);
    }

    if (response?.status === "success") {
      dispatch(submitSetSignupStrategyAsync(response.settings.signupStrategy));
    }
  };
};
