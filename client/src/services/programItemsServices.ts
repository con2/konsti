import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetProgramItemsResponse,
  PostUpdateProgramItemsResponse,
} from "shared/types/api/programItems";
import { api } from "client/utils/api";

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
