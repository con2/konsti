import {
  findSettings,
  saveHidden,
  saveSignupQuestion,
  delSignupQuestion,
  saveSettings,
} from "server/features/settings/settingsRepository";
import {
  DeleteSignupQuestionError,
  DeleteSignupQuestionResponse,
  GetSettingsError,
  GetSettingsResponse,
  PostHiddenError,
  PostHiddenResponse,
  PostSettingsError,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupQuestionError,
  PostSignupQuestionResponse,
} from "shared/types/api/settings";
import { removeHiddenProgramItemsFromUsers } from "server/features/settings/utils/removeHiddenProgramItemsFromUsers";
import { SignupQuestion } from "shared/types/models/settings";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const fetchSettings = async (): Promise<
  GetSettingsResponse | GetSettingsError
> => {
  const findSettingsResult = await findSettings();
  if (isErrorResult(findSettingsResult)) {
    return {
      message: "Getting settings failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(findSettingsResult);

  return {
    message: "Getting settings success",
    status: "success",
    hiddenProgramItemIds: settings.hiddenProgramItemIds,
    appOpen: settings.appOpen,
    signupQuestions: settings.signupQuestions,
    signupStrategy: settings.signupStrategy,
    loginProvider: settings.loginProvider,
  };
};

export const storeHidden = async (
  hiddenProgramItemIds: readonly string[],
): Promise<PostHiddenResponse | PostHiddenError> => {
  const settingsResult = await saveHidden(hiddenProgramItemIds);
  if (isErrorResult(settingsResult)) {
    return {
      message: "Update hidden failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(settingsResult);

  const removeHiddenProgramItemsFromUsersResult =
    await removeHiddenProgramItemsFromUsers(settings.hiddenProgramItemIds);
  if (isErrorResult(removeHiddenProgramItemsFromUsersResult)) {
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
): Promise<PostSignupQuestionResponse | PostSignupQuestionError> => {
  const saveSignupQuestionResult = await saveSignupQuestion(signupQuestionData);
  if (isErrorResult(saveSignupQuestionResult)) {
    return {
      message: "saveSignupQuestion failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(saveSignupQuestionResult);

  return {
    message: "saveSignupQuestion success",
    status: "success",
    signupQuestions: settings.signupQuestions,
  };
};

export const removeSignupQuestion = async (
  programItemId: string,
): Promise<DeleteSignupQuestionResponse | DeleteSignupQuestionError> => {
  const delSignupQuestionResult = await delSignupQuestion(programItemId);
  if (isErrorResult(delSignupQuestionResult)) {
    return {
      message: "delSignupQuestion failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(delSignupQuestionResult);

  return {
    message: "delSignupQuestion success",
    status: "success",
    signupQuestions: settings.signupQuestions,
  };
};

export const updateSettings = async (
  settings: PostSettingsRequest,
): Promise<PostSettingsResponse | PostSettingsError> => {
  const saveSettingsResult = await saveSettings(settings);
  if (isErrorResult(saveSettingsResult)) {
    return {
      message: "Update settings failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = unwrapResult(saveSettingsResult);

  return {
    message: "Update settings success",
    status: "success",
    settings: response,
  };
};
