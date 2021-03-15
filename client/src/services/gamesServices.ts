import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { ServerError } from 'client/typings/utils.typings';
import { PostGamesResponse, GetGamesResponse } from 'shared/typings/api/games';

export const postGamesUpdate = async (): Promise<
  PostGamesResponse | ServerError
> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostGamesResponse>('/games');
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};

export const getGames = async (): Promise<GetGamesResponse | ServerError> => {
  let response;
  try {
    response = await api.get<GetGamesResponse>('/games');
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
