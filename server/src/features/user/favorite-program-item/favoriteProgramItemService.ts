import { saveFavorite } from "server/features/user/favorite-program-item/favoriteProgramItemRepository";
import { ApiError } from "shared/types/api/errors";
import { PostFavoriteResponse } from "shared/types/api/favorite";
import { NewFavorite } from "shared/types/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const storeFavorite = async (
  favoriteData: NewFavorite,
): Promise<PostFavoriteResponse | ApiError> => {
  const favoritedProgramItemsResult = await saveFavorite(favoriteData);

  if (isErrorResult(favoritedProgramItemsResult)) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const favoritedProgramItems = unwrapResult(favoritedProgramItemsResult);

  if (favoritedProgramItems) {
    return {
      message: "Update favorite success",
      status: "success",
      favoritedProgramItems,
    };
  }

  return {
    message: "Update favorite failure",
    status: "error",
    errorId: "unknown",
  };
};
