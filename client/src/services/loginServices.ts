import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import {
  LoginFormFields,
  PostLoginResponse,
} from 'client/typings/user.typings';
import { ServerError } from 'client/typings/utils.typings';

export const postLogin = async (
  loginFormFields: LoginFormFields
): Promise<PostLoginResponse | ServerError> => {
  const { username, password, jwt } = loginFormFields;
  let response: AxiosResponse;
  try {
    response = await api.post<PostLoginResponse>('/login', {
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
