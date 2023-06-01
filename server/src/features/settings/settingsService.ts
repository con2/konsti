import {
  findSettings,
  saveHidden,
  saveSignupQuestion,
  delSignupQuestion,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/typings/api/errors";
import {
  GetSettingsResponse,
  PostHiddenResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupQuestionResponse,
} from "shared/typings/api/settings";
import { Game } from "shared/typings/models/game";
import { removeHiddenGamesFromUsers } from "server/features/settings/utils/removeHiddenGamesFromUsers";
import { SignupQuestion } from "shared/typings/models/settings";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const fetchSettings = async (): Promise<
  GetSettingsResponse | ApiError
> => {
  const findSettingsAsyncResult = await findSettings();
  if (isErrorResult(findSettingsAsyncResult)) {
    return {
      message: "Getting settings failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(findSettingsAsyncResult);

  return {
    message: "Getting settings success",
    status: "success",
    hiddenGames: settings.hiddenGames,
    appOpen: settings.appOpen,
    signupQuestions: settings.signupQuestions,
    signupStrategy: settings.signupStrategy,
  };
};

export const storeHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ApiError> => {
  const settingsAsyncResult = await saveHidden(hiddenData);
  if (isErrorResult(settingsAsyncResult)) {
    return {
      message: "Update hidden failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(settingsAsyncResult);

  try {
    await removeHiddenGamesFromUsers(settings.hiddenGames);
  } catch (error) {
    logger.error(`removeHiddenGamesFromUsers error: ${error}`);
    return {
      message: "Update hidden failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Update hidden success",
    status: "success",
    hiddenGames: settings.hiddenGames,
  };
};

export const storeSignupQuestion = async (
  signupQuestionData: SignupQuestion
): Promise<PostSignupQuestionResponse | ApiError> => {
  let settings;
  try {
    settings = await saveSignupQuestion(signupQuestionData);
  } catch (error) {
    logger.error(`saveSignupQuestion error: ${error}`);
    return {
      message: "saveSignupQuestion failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "saveSignupQuestion success",
    status: "success",
    signupQuestions: settings.signupQuestions,
  };
};

export const removeSignupQuestion = async (
  gameId: string
): Promise<PostSignupQuestionResponse | ApiError> => {
  let settings;
  try {
    settings = await delSignupQuestion(gameId);
  } catch (error) {
    logger.error(`delSignupQuestion error: ${error}`);
    return {
      message: "delSignupQuestion failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "delSignupQuestion success",
    status: "success",
    signupQuestions: settings.signupQuestions,
  };
};

export const updateSettings = async (
  settings: PostSettingsRequest
): Promise<PostSettingsResponse | ApiError> => {
  try {
    const response = await saveSettings(settings);
    return {
      message: "Update settings success",
      status: "success",
      settings: response,
    };
  } catch (error) {
    return {
      message: "Update settings failure",
      status: "error",
      errorId: "unknown",
    };
  }
};
