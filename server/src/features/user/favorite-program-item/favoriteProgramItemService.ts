import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import {
  PostFavoriteError,
  PostFavoriteResponse,
} from "shared/types/api/favorite";
import { NewFavorite } from "shared/types/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeFavorite = async (
  newFavorite: NewFavorite,
): Promise<PostFavoriteResponse | PostFavoriteError> => {
  const saveFavoriteResult = await saveFavorite(newFavorite);

  if (isErrorResult(saveFavoriteResult)) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const favoriteProgramItemIds = unwrapResult(saveFavoriteResult);

  return {
    message: "Update favorite success",
    status: "success",
    favoriteProgramItemIds,
  };
};
