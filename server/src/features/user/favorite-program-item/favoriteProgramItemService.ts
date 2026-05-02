import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import { PostFavoriteResponse } from "shared/types/api/favorite";
import { NewFavorite } from "shared/types/models/user";
export const storeFavorite = async (
  newFavorite: NewFavorite,
): Promise<PostFavoriteResponse> => {
  const saveFavoriteResult = await saveFavorite(newFavorite);

  if (!saveFavoriteResult.ok) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Update favorite success",
    status: "success",
    favoriteProgramItemIds: saveFavoriteResult.value,
  };
};
