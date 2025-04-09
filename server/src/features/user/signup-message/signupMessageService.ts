import { findSettings } from "server/features/settings/settingsRepository";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
} from "shared/types/api/users";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const fetchSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  const findSettingsResult = await findSettings();
  if (isErrorResult(findSettingsResult)) {
    return {
      message: "Error loading data from DB",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(findSettingsResult);

  const signupsResult = await findDirectSignups();
  if (isErrorResult(signupsResult)) {
    return {
      message: "Error loading data from DB",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsResult);

  const signupMessages = signups.flatMap((signup) => {
    return signup.userSignups.flatMap((userSignup) => {
      if (userSignup.message) {
        const signupQuestion = settings.signupQuestions.find(
          (question) => question.programItemId === signup.programItemId,
        );
        if (!signupQuestion) {
          return [];
        }

        return {
          programItemId: signup.programItemId,
          username: userSignup.username,
          message: userSignup.message,
          private: signupQuestion.private,
        };
      }
      return [];
    });
  });

  return {
    signupMessages,
    message: "Succesfully loaded signup messages",
    status: "success",
  };
};
