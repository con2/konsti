import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import { FavoriteData, PostFavoriteResponse } from 'typings/user.typings';
import { ServerError } from 'typings/utils.typings';

export const postFavorite = async (
  favoriteData: FavoriteData
): Promise<PostFavoriteResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostFavoriteResponse>('/favorite', {
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
