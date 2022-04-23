import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { FAVORITE_ENDPOINT } from "shared/constants/apiEndpoints";
import {
  SaveFavoriteRequest,
  PostFavoriteResponse,
} from "shared/typings/api/favorite";

export const postFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse | ApiError> => {
  const response = await api.post<PostFavoriteResponse>(
    FAVORITE_ENDPOINT,
    favoriteData
  );

  return response.data;
};
