import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
  PostUpdateProgramItemsError,
} from "shared/types/api/programItems";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postUpdateGames = async (): Promise<
  PostUpdateProgramItemsResponse | PostUpdateProgramItemsError
> => {
  const response = await api.post<PostUpdateProgramItemsResponse, {}>(
    ApiEndpoint.GAMES,
  );
  return response.data;
};

export const getGames = async (): Promise<
  GetProgramItemsResponse | ApiError
> => {
  const response = await api.get<GetProgramItemsResponse, {}>(
    ApiEndpoint.GAMES,
  );
  return response.data;
};
