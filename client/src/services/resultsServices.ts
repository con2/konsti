import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { GetResultsResponse } from "shared/types/api/results";
import { api } from "client/utils/api";

export const getResults = async (): Promise<GetResultsResponse> => {
  const response = await api.get<GetResultsResponse>(ApiEndpoint.RESULTS);
  return response.data;
};
