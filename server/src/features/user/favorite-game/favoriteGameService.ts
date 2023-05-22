import { saveFavorite } from "server/features/user/favorite-game/favoriteGameRepository";
import { ApiError } from "shared/typings/api/errors";
import {
  PostFavoriteResponse,
  PostFavoriteRequest,
} from "shared/typings/api/favorite";

export const storeFavorite = async (
  favoriteData: PostFavoriteRequest
): Promise<PostFavoriteResponse | ApiError> => {
  let favoritedGames;
  try {
    favoritedGames = await saveFavorite(favoriteData);
  } catch (error) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
    };
  }

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
