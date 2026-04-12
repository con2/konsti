import { api } from "client/utils/api";
import {
  PostUpdateProgramItemsResponse,
  GetProgramItemsResponse,
} from "shared/types/api/programItems";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const postUpdateProgramItems =
  async (): Promise<PostUpdateProgramItemsResponse> => {
    const response = await api.post<PostUpdateProgramItemsResponse>(
      ApiEndpoint.PROGRAM_ITEMS,
    );
    return response.data;
  };

export const getProgramItems = async (): Promise<GetProgramItemsResponse> => {
  const response = await api.get<GetProgramItemsResponse>(
    ApiEndpoint.PROGRAM_ITEMS,
  );
  return response.data;
};
