import { api } from "client/utils/api";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import {
  PostAddSerialsRequest,
  PostAddSerialsResponse,
} from "shared/test-types/api/testData";

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
