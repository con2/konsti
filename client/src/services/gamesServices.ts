import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { PostGamesResponse, GetGamesResponse } from "shared/typings/api/games";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postGamesUpdate = async (): Promise<
  PostGamesResponse | ApiError
> => {
  const response = await api.post<PostGamesResponse>(ApiEndpoint.GAMES);
  return response.data;
};

export const getGames = async (): Promise<GetGamesResponse | ApiError> => {
  const response = await api.get<GetGamesResponse>(ApiEndpoint.GAMES);
  return response.data;
};
