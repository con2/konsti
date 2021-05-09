import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { ServerError } from 'shared/typings/api/errors';
import { LOGIN_ENDPOINT } from 'shared/constants/apiEndpoints';
import { LoginFormFields, PostLoginResponse } from 'shared/typings/api/login';

export const postLogin = async (
  loginFormFields: LoginFormFields
): Promise<PostLoginResponse | ServerError> => {
  const { username, password, jwt } = loginFormFields;
  let response: AxiosResponse;
  try {
    response = await api.post<PostLoginResponse>(LOGIN_ENDPOINT, {
      username,
      password,
      jwt,
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
