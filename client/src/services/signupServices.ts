import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { SignupData, PostSignupResponse } from 'client/typings/user.typings';
import { ServerError } from 'client/typings/utils.typings';
import { SIGNUP_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postSignup = async (
  signupData: SignupData
): Promise<PostSignupResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostSignupResponse>(SIGNUP_ENDPOINT, {
      signupData,
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
