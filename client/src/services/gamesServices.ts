import { api } from "client/utils/api";
import { ServerError } from "shared/typings/api/errors";
import { PostGamesResponse, GetGamesResponse } from "shared/typings/api/games";
import { GAMES_ENDPOINT } from "shared/constants/apiEndpoints";

export const postGamesUpdate = async (): Promise<
  PostGamesResponse | ServerError
> => {
  const response = await api.post<PostGamesResponse>(GAMES_ENDPOINT);
  return response.data;
};

export const getGames = async (): Promise<GetGamesResponse | ServerError> => {
  const response = await api.get<GetGamesResponse>(GAMES_ENDPOINT);
  return response.data;
};
