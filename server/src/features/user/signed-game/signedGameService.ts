import { isValidSignupTime } from "server/features/user/userUtils";
import {
  PostSignedGamesError,
  PostSignedGamesResponse,
} from "shared/typings/api/myGames";
import { SelectedGame } from "shared/typings/models/user";
import { UserSignedGames } from "server/typings/result.typings";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";

export const storeSignedGames = async (
  selectedGames: readonly SelectedGame[],
  username: string,
  signupTime: string
): Promise<PostSignedGamesResponse | PostSignedGamesError> => {
  if (!signupTime) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const validSignupTime = isValidSignupTime(signupTime);
  if (!validSignupTime) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  const modifiedSignupData: UserSignedGames = {
    signedGames: selectedGames,
    username,
  };

  try {
    const response = await saveSignedGames(modifiedSignupData);
    return {
      message: "Signup success",
      status: "success",
      signedGames: response.signedGames,
    };
  } catch (error) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }
};
