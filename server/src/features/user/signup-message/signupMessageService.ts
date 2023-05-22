import { findSettings } from "server/features/settings/settingsRepository";
import { Signup } from "server/features/signup/signup.typings";
import { findSignups } from "server/features/signup/signupRepository";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
} from "shared/typings/api/users";
import { Settings } from "shared/typings/models/settings";

export const fetchSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  let signups: Signup[];
  let settings: Settings;
  try {
    signups = await findSignups();
    settings = await findSettings();
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
