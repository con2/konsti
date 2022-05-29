import { getUser } from "client/services/userServices";
import { postFavorite } from "client/services/favoriteServices";
import { AppThunk } from "client/typings/redux.typings";
import { SaveFavoriteRequest } from "shared/typings/api/favorite";
import {
  submitDeleteEnteredAsync,
  submitPostEnteredGameAsync,
  submitGetUserAsync,
  submitPostSignedGamesAsync,
  submitUpdateFavoritesAsync,
} from "client/views/my-games/myGamesSlice";
import {
  DeleteEnteredGameParameters,
  PostEnteredGameParameters,
  SignupData,
} from "shared/typings/api/myGames";
import {
  deleteEnteredGame,
  postEnteredGame,
  postSignedGames,
} from "client/services/myGamesServices";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export const submitGetUser = (username: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getUserResponse = await getUser(username);

    if (getUserResponse?.status === "error") {
      // TODO
    }

    if (getUserResponse?.status === "success") {
      const enteredGames = getUserResponse.games.enteredGames;
      const favoritedGames = getUserResponse.games.favoritedGames;
      const signedGames = getUserResponse.games.signedGames;

      dispatch(
        submitGetUserAsync({
          enteredGames,
          favoritedGames,
          signedGames,
        })
      );
    }
  };
};

export const submitUpdateFavorites = (
  favoriteData: SaveFavoriteRequest
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const updateFavoriteResponse = await postFavorite(favoriteData);

    if (updateFavoriteResponse?.status === "error") {
      // TODO
    }

    if (updateFavoriteResponse?.status === "success") {
      dispatch(
        submitUpdateFavoritesAsync(updateFavoriteResponse.favoritedGames)
      );
    }
  };
};

export enum PostEnteredGameError {
  GAME_FULL = "signup.gameIsFull",
  UNKNOWN = "signupError.generic",
  SIGNUP_ENDED = "signupError.signupEnded",
  EMPTY = "",
}

export const submitPostEnteredGame = (
  data: PostEnteredGameParameters
): AppThunk<Promise<PostEnteredGameError | undefined>> => {
  return async (dispatch): Promise<PostEnteredGameError | undefined> => {
    const signupResponse = await postEnteredGame(data);

    if (signupResponse?.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return PostEnteredGameError.SIGNUP_ENDED;
        case "gameFull":
          return PostEnteredGameError.GAME_FULL;
        case "unknown":
          return PostEnteredGameError.UNKNOWN;
        default:
          exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    if (signupResponse?.status === "success") {
      dispatch(submitPostEnteredGameAsync(signupResponse.enteredGame));
    }
  };
};

export const submitDeleteEnteredGame = (
  data: DeleteEnteredGameParameters
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const signupResponse = await deleteEnteredGame(data);

    if (signupResponse?.status === "error") {
      // TODO
    }

    if (signupResponse?.status === "success") {
      dispatch(submitDeleteEnteredAsync(data.enteredGameId));
    }
  };
};

export const submitPostSignedGames = (
  signupData: SignupData
): AppThunk<Promise<string | undefined>> => {
  return async (dispatch): Promise<string | undefined> => {
    const signupResponse = await postSignedGames(signupData);

    if (signupResponse?.status === "error") {
      return signupResponse.errorId;
    }

    if (signupResponse?.status === "success") {
      dispatch(submitPostSignedGamesAsync(signupResponse.signedGames));
    }
  };
};
