import { findSettings } from "server/features/settings/settingsRepository";
import { Signup } from "server/features/signup/signup.typings";
import { findSignups } from "server/features/signup/signupRepository";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
} from "shared/typings/api/users";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const fetchSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  const findSettingsAsyncResult = await findSettings();
  if (isErrorResult(findSettingsAsyncResult)) {
    return {
      message: "Error loading data from DB",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(findSettingsAsyncResult);

  let signups: Signup[];

  try {
    signups = await findSignups();
  } catch (error) {
    return {
      message: "Error loading data from DB",
      status: "error",
      errorId: "unknown",
    };
  }

  const signupMessages = signups.flatMap((signup) => {
    return signup.userSignups.flatMap((userSignup) => {
      if (userSignup.message) {
        const signupQuestion = settings.signupQuestions.find(
          (question) => question.gameId === signup.game.gameId
        );
        if (!signupQuestion) return [];

        return {
          gameId: signup.game.gameId,
          username: userSignup.username,
          message: userSignup.message,
          private: signupQuestion?.private,
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
