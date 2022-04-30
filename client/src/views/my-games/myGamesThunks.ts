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

export const submitGetUser = (username: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getUserResponse = await getUser(username);

    if (getUserResponse?.status === "error") {
      return await Promise.reject(getUserResponse);
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
      return await Promise.reject(updateFavoriteResponse);
    }

    if (updateFavoriteResponse?.status === "success") {
      dispatch(
        submitUpdateFavoritesAsync(updateFavoriteResponse.favoritedGames)
      );
    }
  };
};

export const submitPostEnteredGame = (
  data: PostEnteredGameParameters
): AppThunk<Promise<number | undefined>> => {
  return async (dispatch): Promise<number | undefined> => {
    const signupResponse = await postEnteredGame(data);

    if (signupResponse?.status === "error") {
      if (signupResponse.code === 51) {
        console.error("Entered game is full"); // eslint-disable-line no-console
      }
      return signupResponse.code;
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
      return await Promise.reject(signupResponse);
    }

    if (signupResponse?.status === "success") {
      dispatch(submitDeleteEnteredAsync(data.enteredGameId));
    }
  };
};

export const submitPostSignedGames = (
  signupData: SignupData
): AppThunk<Promise<number | undefined>> => {
  return async (dispatch): Promise<number | undefined> => {
    const signupResponse = await postSignedGames(signupData);

    if (signupResponse?.status === "error") {
      return signupResponse.code;
    }

    if (signupResponse?.status === "success") {
      dispatch(submitPostSignedGamesAsync(signupResponse.signedGames));
    }
  };
};
