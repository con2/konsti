import { findSettings } from "server/features/settings/settingsRepository";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { GetSignupMessagesResponse } from "shared/types/api/users";
export const fetchSignupMessages =
  async (): Promise<GetSignupMessagesResponse> => {
    const findSettingsResult = await findSettings();
    if (!findSettingsResult.ok) {
      return {
        message: "Error loading data from DB",
        status: "error",
        errorId: "unknown",
      };
    }

    const signupsResult = await findDirectSignups();
    if (!signupsResult.ok) {
      return {
        message: "Error loading data from DB",
        status: "error",
        errorId: "unknown",
      };
    }

    const signupMessages = signupsResult.value.flatMap((signup) => {
      return signup.userSignups.flatMap((userSignup) => {
        if (userSignup.message) {
          const signupQuestion = findSettingsResult.value.signupQuestions.find(
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
