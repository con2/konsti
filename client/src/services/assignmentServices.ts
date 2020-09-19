import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import { PostPlayerAssignmentResponse } from 'typings/result.typings';
import { ServerError } from 'typings/utils.typings';

export const postPlayerAssignment = async (
  signupTime: string
): Promise<PostPlayerAssignmentResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostPlayerAssignmentResponse>('/assignment', {
      startingTime: signupTime,
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
