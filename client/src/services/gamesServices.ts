import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import { ServerError } from 'typings/utils.typings';
import {
  PostGamesUpdateResponse,
  GetGamesResponse,
} from 'typings/game.typings';

export const postGamesUpdate = async (): Promise<
  PostGamesUpdateResponse | ServerError
> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostGamesUpdateResponse>('/games');
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
