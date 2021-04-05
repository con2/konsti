import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import {
  FavoriteData,
  PostFavoriteResponse,
} from 'client/typings/user.typings';
import { ServerError } from 'client/typings/utils.typings';
import { FAVORITE_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postFavorite = async (
  favoriteData: FavoriteData
): Promise<PostFavoriteResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostFavoriteResponse>(FAVORITE_ENDPOINT, {
      favoriteData,
    });
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
