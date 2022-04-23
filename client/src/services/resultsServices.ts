import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { RESULTS_ENDPOINT } from "shared/constants/apiEndpoints";
import { GetResultsResponse } from "shared/typings/api/results";

export const getResults = async (
  startTime: string
): Promise<GetResultsResponse | ApiError> => {
  const response = await api.get<GetResultsResponse>(RESULTS_ENDPOINT, {
    params: {
      startTime,
    },
  });

  return response.data;
};
