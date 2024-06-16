import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFavoriteRequest,
  PostFavoriteResponse,
} from "shared/types/api/favorite";

export const postFavorite = async (
  postFavoriteRequest: PostFavoriteRequest,
): Promise<PostFavoriteResponse | ApiError> => {
  const response = await api.post<PostFavoriteResponse, PostFavoriteRequest>(
    ApiEndpoint.FAVORITE,
    postFavoriteRequest,
  );

  return response.data;
};
