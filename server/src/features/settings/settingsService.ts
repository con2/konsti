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

export const fetchSettings = async (): Promise<
  GetSettingsResponse | ApiError
> => {
  try {
    const response = await findSettings();

    return {
      message: "Getting settings success",
      status: "success",
      hiddenGames: response.hiddenGames,
      appOpen: response.appOpen,
      signupQuestions: response.signupQuestions,
      signupStrategy: response.signupStrategy,
    };
  } catch (error) {
    logger.error(`Settings: ${error}`);
    return {
      message: "Getting settings failed",
      status: "error",
      errorId: "unknown",
    };
  }
};

export const storeHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ApiError> => {
  let settings;
  try {
    settings = await saveHidden(hiddenData);
  } catch (error) {
    logger.error(`saveHidden error: ${error}`);
    return {
      message: "Update hidden failure",
      status: "error",
      errorId: "unknown",
    };
  }

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
