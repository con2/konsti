import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  SaveFavoriteRequest,
  PostFavoriteResponse,
} from "shared/typings/api/favorite";

export const postFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse | ApiError> => {
  const response = await api.post<PostFavoriteResponse>(
    ApiEndpoint.FAVORITE,
    favoriteData
  );

  return response.data;
};
