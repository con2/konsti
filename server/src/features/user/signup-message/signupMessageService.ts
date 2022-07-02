import { findSettings } from "server/features/settings/settingsRepository";
import { findUsers } from "server/features/user/userRepository";
import { Settings } from "shared/typings/models/settings";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
} from "shared/typings/models/signupMessage";
import { User } from "shared/typings/models/user";

export const fetchSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  let users: User[];
  let settings: Settings;
  try {
    users = await findUsers();
    settings = await findSettings();
  } catch (error) {
    return {
      message: "Error loading data from DB",
      status: "error",
      errorId: "unknown",
    };
  }

  const signupMessages = users.flatMap((user) => {
    return user.enteredGames.flatMap((enteredGame) => {
      if (enteredGame.message) {
        const signupQuestion = settings.signupQuestions.find(
          (question) => question.gameId === enteredGame.gameDetails.gameId
        );
        if (!signupQuestion) return [];

        return {
          gameId: enteredGame.gameDetails.gameId,
          username: user.username,
          message: enteredGame.message,
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
