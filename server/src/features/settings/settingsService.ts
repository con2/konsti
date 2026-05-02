import {
  findSettings,
  saveHidden,
  saveSignupQuestion,
  delSignupQuestion,
  saveSettings,
} from "server/features/settings/settingsRepository";
import {
  DeleteSignupQuestionResponse,
  GetSettingsResponse,
  PostHiddenResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupQuestionResponse,
} from "shared/types/api/settings";
import { removeHiddenProgramItemsFromUsers } from "server/features/settings/utils/removeHiddenProgramItemsFromUsers";
import { SignupQuestion } from "shared/types/models/settings";
export const fetchSettings = async (): Promise<GetSettingsResponse> => {
  const findSettingsResult = await findSettings();
  if (!findSettingsResult.ok) {
    return {
      message: "Getting settings failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = findSettingsResult.value;

  return {
    message: "Getting settings success",
    status: "success",
    hiddenProgramItemIds: settings.hiddenProgramItemIds,
    appOpen: settings.appOpen,
    signupQuestions: settings.signupQuestions,
    signupStrategy: settings.signupStrategy,
    loginProvider: settings.loginProvider,
    emailNotificationTrigger: settings.emailNotificationTrigger,
  };
};

export const storeHidden = async (
  hiddenProgramItemIds: readonly string[],
): Promise<PostHiddenResponse> => {
  const settingsResult = await saveHidden(hiddenProgramItemIds);
  if (!settingsResult.ok) {
    return {
      message: "Update hidden failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = settingsResult.value;

  const removeHiddenProgramItemsFromUsersResult =
    await removeHiddenProgramItemsFromUsers(settings.hiddenProgramItemIds);
  if (!removeHiddenProgramItemsFromUsersResult.ok) {
    return {
      message: "Update hidden failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Update hidden success",
    status: "success",
    hiddenProgramItemIds: settings.hiddenProgramItemIds,
  };
};

export const storeSignupQuestion = async (
  signupQuestionData: SignupQuestion,
): Promise<PostSignupQuestionResponse> => {
  const saveSignupQuestionResult = await saveSignupQuestion(signupQuestionData);
  if (!saveSignupQuestionResult.ok) {
    return {
      message: "saveSignupQuestion failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = saveSignupQuestionResult.value;

  return {
    message: "saveSignupQuestion success",
    status: "success",
    signupQuestions: settings.signupQuestions,
  };
};

export const removeSignupQuestion = async (
  programItemId: string,
): Promise<DeleteSignupQuestionResponse> => {
  const delSignupQuestionResult = await delSignupQuestion(programItemId);
  if (!delSignupQuestionResult.ok) {
    return {
      message: "delSignupQuestion failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = delSignupQuestionResult.value;

  return {
    message: "delSignupQuestion success",
    status: "success",
    signupQuestions: settings.signupQuestions,
  };
};

export const updateSettings = async (
  settings: PostSettingsRequest,
): Promise<PostSettingsResponse> => {
  const saveSettingsResult = await saveSettings(settings);
  if (!saveSettingsResult.ok) {
    return {
      message: "Update settings failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = saveSettingsResult.value;

  return {
    message: "Update settings success",
    status: "success",
    settings: response,
  };
};
