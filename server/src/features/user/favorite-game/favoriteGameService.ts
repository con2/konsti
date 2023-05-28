import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";
import { ApiError } from "shared/typings/api/errors";
import { PostFavoriteResponse } from "shared/typings/api/favorite";
import { NewFavorite } from "shared/typings/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const storeFavorite = async (
  favoriteData: NewFavorite
): Promise<PostFavoriteResponse | ApiError> => {
  const favoritedGamesAsyncResult = await saveFavorite(favoriteData);

  if (isErrorResult(favoritedGamesAsyncResult)) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const favoritedGames = unwrapResult(favoritedGamesAsyncResult);

  if (favoritedGames) {
    return {
      message: "Update favorite success",
      status: "success",
      favoritedGames,
    };
  }

  return {
    message: "Update favorite failure",
    status: "error",
    errorId: "unknown",
  };
};
