import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import {
  PostAddSerialsRequest,
  PostAddSerialsResponse,
} from "shared/test-types/api/testData";
import { api } from "client/utils/api";

export const postAddSerials = async (
  count: number,
): Promise<PostAddSerialsResponse> => {
  const response = await api.post<
    PostAddSerialsResponse,
    PostAddSerialsRequest
  >(ApiDevEndpoint.ADD_SERIALS, {
    count,
  });
  return response.data;
};
