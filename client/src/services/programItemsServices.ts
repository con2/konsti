import { api } from "client/utils/api";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
  PostUpdateProgramItemsError,
  GetProgramItemsError,
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
  GetProgramItemsResponse | GetProgramItemsError
> => {
  const response = await api.get<GetProgramItemsResponse>(
    ApiEndpoint.PROGRAM_ITEMS,
  );
  return response.data;
};
