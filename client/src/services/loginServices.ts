import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import {
  LoginFormFields,
  PostLoginResponse,
} from 'client/typings/user.typings';
import { ServerError } from 'shared/typings/api/errors';
import { LOGIN_ENDPOINT } from 'shared/constants/apiEndpoints';

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
