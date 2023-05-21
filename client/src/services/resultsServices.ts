import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetResultsRequest,
  GetResultsResponse,
} from "shared/typings/api/results";

export const getResults = async (
  startTime: string
): Promise<GetResultsResponse | ApiError> => {
  const response = await api.get<GetResultsResponse, GetResultsRequest>(
    ApiEndpoint.RESULTS,
    {
      params: {
        startTime,
      },
    }
  );

  return response.data;
};
