import { api } from "client/utils/api";
import { ServerError } from "shared/typings/api/errors";
import {
  LOGIN_ENDPOINT,
  SESSION_RESTORE_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { LoginFormFields, PostLoginResponse } from "shared/typings/api/login";

export const postLogin = async (
  loginFormFields: LoginFormFields
): Promise<PostLoginResponse | ServerError> => {
  const { username, password } = loginFormFields;

  const response = await api.post<PostLoginResponse>(LOGIN_ENDPOINT, {
    username,
    password,
  });
  return response.data;
};

export const postSessionRecovery = async (
  jwt: string
): Promise<PostLoginResponse | ServerError> => {
  const response = await api.post<PostLoginResponse>(SESSION_RESTORE_ENDPOINT, {
    jwt,
  });
  return response.data;
};
