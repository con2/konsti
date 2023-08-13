import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import {
  PostUpdateGamesResponse,
  GetGamesResponse,
  PostUpdateGamesError,
} from "shared/typings/api/games";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postUpdateGames = async (): Promise<
  PostUpdateGamesResponse | PostUpdateGamesError
> => {
  const response = await api.post<PostUpdateGamesResponse, {}>(
    ApiEndpoint.GAMES,
  );
  return response.data;
};

export const getGames = async (): Promise<GetGamesResponse | ApiError> => {
  const response = await api.get<GetGamesResponse, {}>(ApiEndpoint.GAMES);
  return response.data;
};
