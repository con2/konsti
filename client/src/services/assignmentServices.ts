import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { PostPlayerAssignmentResponse } from 'client/typings/result.typings';
import { ServerError } from 'client/typings/utils.typings';

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
