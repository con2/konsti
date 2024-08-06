import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
  PostUpdateProgramItemsError,
} from "shared/types/api/programItems";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postUpdateProgramItems = async (): Promise<
  PostUpdateProgramItemsResponse | PostUpdateProgramItemsError
> => {
  const response = await api.post<PostUpdateProgramItemsResponse>(
    ApiEndpoint.PROGRAM_ITEMS,
  );
  return response.data;
};

export const getProgramItems = async (): Promise<
  GetProgramItemsResponse | ApiError
> => {
  const response = await api.get<GetProgramItemsResponse>(
    ApiEndpoint.PROGRAM_ITEMS,
  );
  return response.data;
};
