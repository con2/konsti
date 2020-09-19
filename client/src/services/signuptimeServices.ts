import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import { ServerError, PostSignupTimeResult } from 'typings/utils.typings';

export const postSignupTime = async (
  signupTime: string
): Promise<PostSignupTimeResult | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostSignupTimeResult>('/signuptime', {
      signupTime,
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
