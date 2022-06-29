import {
  findSettings,
  saveHidden,
  saveSignupMessage,
  delSignupMessage,
  saveSettings,
} from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/typings/api/errors";
import {
  GetSettingsResponse,
  PostHiddenResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupMessageResponse,
} from "shared/typings/api/settings";
import { Game } from "shared/typings/models/game";
import { removeHiddenGamesFromUsers } from "server/features/settings/utils/removeHiddenGamesFromUsers";
import { SignupMessage } from "shared/typings/models/settings";

export const fetchSettings = async (
  includePrivateMessages: boolean
): Promise<GetSettingsResponse | ApiError> => {
  try {
    const response = await findSettings();

    return {
      message: "Getting settings success",
      status: "success",
      hiddenGames: response.hiddenGames,
      signupTime: response.signupTime || "",
      appOpen: response.appOpen,
      signupMessages: includePrivateMessages
        ? response.signupMessages
        : response.signupMessages.filter(
            (signupMessage) => !signupMessage.private
          ),
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

export const storeSignupMessage = async (
  signupMessageData: SignupMessage
): Promise<PostSignupMessageResponse | ApiError> => {
  let settings;
  try {
    settings = await saveSignupMessage(signupMessageData);
  } catch (error) {
    logger.error(`saveSignupMessage error: ${error}`);
    return {
      message: "saveSignupMessage failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "saveSignupMessage success",
    status: "success",
    signupMessages: settings.signupMessages,
  };
};

export const removeSignupMessage = async (
  gameId: string
): Promise<PostSignupMessageResponse | ApiError> => {
  let settings;
  try {
    settings = await delSignupMessage(gameId);
  } catch (error) {
    logger.error(`delSignupMessage error: ${error}`);
    return {
      message: "delSignupMessage failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "delSignupMessage success",
    status: "success",
    signupMessages: settings.signupMessages,
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
