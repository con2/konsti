import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";
import { ApiError } from "shared/typings/api/errors";
import { PostFavoriteResponse } from "shared/typings/api/favorite";
import { NewFavorite } from "shared/typings/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeFavorite = async (
  favoriteData: NewFavorite
): Promise<PostFavoriteResponse | ApiError> => {
  const favoritedGamesResult = await saveFavorite(favoriteData);

  if (isErrorResult(favoritedGamesResult)) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const favoritedGames = unwrapResult(favoritedGamesResult);

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
