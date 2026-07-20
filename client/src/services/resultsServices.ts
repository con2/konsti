import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { GetResultsResponse } from "shared/types/api/results";

export const getResults = async (): Promise<GetResultsResponse> => {
  const response = await api.get<GetResultsResponse>(ApiEndpoint.RESULTS);
  return response.data;
};
