import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import { ServerError } from 'typings/utils.typings';
import { GetResultsResponse } from 'typings/result.typings';

export const getResults = async (
  startTime: string
): Promise<GetResultsResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.get<GetResultsResponse>('/results', {
      params: {
        startTime,
      },
    });
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
