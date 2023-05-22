import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFavoriteRequest,
  PostFavoriteResponse,
} from "shared/typings/api/favorite";

export const postFavorite = async (
  favoriteData: PostFavoriteRequest
): Promise<PostFavoriteResponse | ApiError> => {
  const response = await api.post<PostFavoriteResponse, PostFavoriteRequest>(
    ApiEndpoint.FAVORITE,
    favoriteData
  );

  return response.data;
};
