import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFavoriteRequest,
  PostFavoriteResponse,
} from "shared/types/api/favorite";

export const postFavorite = async (
  postFavoriteRequest: PostFavoriteRequest,
): Promise<PostFavoriteResponse> => {
  const response = await api.post<PostFavoriteResponse, PostFavoriteRequest>(
    ApiEndpoint.FAVORITE,
    postFavoriteRequest,
  );

  return response.data;
};
