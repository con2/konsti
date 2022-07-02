import { postHidden } from "client/services/hiddenServices";
import {
  deleteSignupQuestion,
  getSettings,
  postSignupQuestion,
  postSettings,
} from "client/services/settingsServices";
import { Game } from "shared/typings/models/game";
import { AppThunk } from "client/typings/redux.typings";
import {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitActiveSignupTimeAsync,
  submitToggleAppOpenAsync,
  updateSignupQuestions,
  submitSetSignupStrategyAsync,
  submitGetSignupMessagesAsync,
} from "client/views/admin/adminSlice";
import { SignupQuestion } from "shared/typings/models/settings";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { getSignupMessages } from "client/services/userServices";

export const submitUpdateHidden = (hiddenGames: readonly Game[]): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateHiddenResponse = await postHidden(hiddenGames);

    if (updateHiddenResponse?.status === "error") {
      // TODO
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
      // TODO
    }

    if (settingsResponse?.status === "success") {
      dispatch(
        submitGetSettingsAsync({
          hiddenGames: settingsResponse.hiddenGames,
          signupTime: settingsResponse.signupTime,
          appOpen: settingsResponse.appOpen,
          signupQuestions: settingsResponse.signupQuestions,
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
      // TODO
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
      // TODO
    }

    if (postSettingsResponse?.status === "success") {
      dispatch(submitToggleAppOpenAsync(postSettingsResponse.settings.appOpen));
    }
  };
};

export const submitAddSignupQuestion = (
  signupQuestion: SignupQuestion
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSignupQuestion({
      gameId: signupQuestion.gameId,
      message: signupQuestion.message,
      private: signupQuestion.private,
    });

    if (response?.status === "error") {
      // TODO
    }

    if (response?.status === "success") {
      dispatch(updateSignupQuestions(response.signupQuestions));
    }
  };
};

export const submitDeleteSignupQuestion = (gameId: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await deleteSignupQuestion(gameId);

    if (response?.status === "error") {
      // TODO
    }

    if (response?.status === "success") {
      dispatch(updateSignupQuestions(response.signupQuestions));
    }
  };
};

export const submitSetSignupStrategy = (
  signupStrategy: SignupStrategy
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await postSettings({ signupStrategy });

    if (response?.status === "error") {
      // TODO
    }

    if (response?.status === "success") {
      dispatch(submitSetSignupStrategyAsync(response.settings.signupStrategy));
    }
  };
};

export const submitGetSignupMessages = (): AppThunk => {
  return async (dispatch): Promise<void> => {
    const response = await getSignupMessages();

    if (response?.status === "error") {
      // TODO
    }

    if (response?.status === "success") {
      dispatch(submitGetSignupMessagesAsync(response.signupMessages));
    }
  };
};
