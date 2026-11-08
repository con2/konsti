import { GetSignupMessagesResponse } from "shared/types/api/users";
import { findDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { findUsernamesByUserIds } from "server/features/user/userRepository";

export const fetchSignupMessages =
  async (): Promise<GetSignupMessagesResponse> => {
    const findSettingsResult = await findOrCreateSettings();
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

    const usernamesResult = await findUsernamesByUserIds(
      signupsResult.value.flatMap((signup) =>
        signup.userSignups.map((userSignup) => userSignup.userId),
      ),
    );
    if (!usernamesResult.ok) {
      return {
        message: "Failed to load signup messages",
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
            username: usernamesResult.value.get(userSignup.userId) ?? "",
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
