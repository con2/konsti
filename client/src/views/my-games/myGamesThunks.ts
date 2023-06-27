import { getUser } from "client/services/userServices";
import { postFavorite } from "client/services/favoriteServices";
import { AppThunk } from "client/typings/redux.typings";
import {
  submitDeleteEnteredAsync,
  submitPostEnteredGameAsync,
  submitGetUserAsync,
  submitPostSignedGamesAsync,
  submitUpdateFavoritesAsync,
} from "client/views/my-games/myGamesSlice";
import {
  DeleteEnteredGameRequest,
  PostEnteredGameRequest,
  PostSignedGamesRequest,
} from "shared/typings/api/myGames";
import {
  deleteEnteredGame,
  postEnteredGame,
  postSignedGames,
} from "client/services/myGamesServices";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { NewFavorite } from "shared/typings/models/user";
import { submitUpdateEventLogItemsAsync } from "client/views/login/loginSlice";

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
      const eventLogItems = getUserResponse.eventLogItems;

      dispatch(
        submitGetUserAsync({
          enteredGames,
          favoritedGames,
          signedGames,
        })
      );

      dispatch(submitUpdateEventLogItemsAsync(eventLogItems));
    }
  };
};

export const submitUpdateFavorites = (favoriteData: NewFavorite): AppThunk => {
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

export enum PostEnteredGameErrorMessage {
  GAME_FULL = "signupError.programFull",
  UNKNOWN = "signupError.generic",
  SIGNUP_ENDED = "signupError.signupEnded",
  SIGNUP_NOT_OPEN_YET = "signupError.signupNotOpenYet",
}

export const submitPostEnteredGame = (
  data: PostEnteredGameRequest
): AppThunk<Promise<PostEnteredGameErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostEnteredGameErrorMessage | undefined> => {
    const signupResponse = await postEnteredGame(data);

    if (signupResponse?.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return PostEnteredGameErrorMessage.SIGNUP_ENDED;
        case "gameFull":
          return PostEnteredGameErrorMessage.GAME_FULL;
        case "signupNotOpenYet":
          return PostEnteredGameErrorMessage.SIGNUP_NOT_OPEN_YET;
        case "unknown":
          return PostEnteredGameErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    if (signupResponse?.status === "success") {
      dispatch(submitPostEnteredGameAsync(signupResponse.enteredGame));
    }
  };
};

export enum DeleteEnteredGameErrorMessage {
  UNKNOWN = "signupError.cancelFailed",
  SIGNUP_ENDED = "signupError.signupEnded",
}

export const submitDeleteEnteredGame = (
  data: DeleteEnteredGameRequest
): AppThunk<Promise<DeleteEnteredGameErrorMessage | undefined>> => {
  return async (
    dispatch
  ): Promise<DeleteEnteredGameErrorMessage | undefined> => {
    const signupResponse = await deleteEnteredGame(data);

    if (signupResponse?.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return DeleteEnteredGameErrorMessage.SIGNUP_ENDED;
        case "unknown":
          return DeleteEnteredGameErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }
    if (signupResponse?.status === "success") {
      dispatch(submitDeleteEnteredAsync(data.enteredGameId));
    }
  };
};

export enum PostSignedGamesErrorMessage {
  SIGNUP_ENDED = "signupError.signupEnded",
  SAME_PRIORITY = "signupError.samePriority",
  UNKNOWN = "signupError.generic",
}

export const submitPostSignedGames = (
  signupData: PostSignedGamesRequest
): AppThunk<Promise<PostSignedGamesErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostSignedGamesErrorMessage | undefined> => {
    const signupResponse = await postSignedGames(signupData);

    if (signupResponse?.status === "error") {
      switch (signupResponse.errorId) {
        case "signupEnded":
          return PostSignedGamesErrorMessage.SIGNUP_ENDED;
        case "samePriority":
          return PostSignedGamesErrorMessage.SAME_PRIORITY;
        case "unknown":
          return PostSignedGamesErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(signupResponse.errorId);
      }
    }

    if (signupResponse?.status === "success") {
      dispatch(submitPostSignedGamesAsync(signupResponse.signedGames));
    }
  };
};
