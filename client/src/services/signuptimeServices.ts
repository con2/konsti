import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { PostSignupTimeResult } from 'client/typings/utils.typings';
import { SIGNUPTIME_ENDPOINT } from 'shared/constants/apiEndpoints';
import { ServerError } from 'shared/typings/api/errors';

export const postSignupTime = async (
  signupTime: string
): Promise<PostSignupTimeResult | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostSignupTimeResult>(SIGNUPTIME_ENDPOINT, {
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
