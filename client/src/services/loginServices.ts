import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  LoginFormFields,
  PostLoginError,
  PostLoginResponse,
} from "shared/typings/api/login";

export const postLogin = async (
  loginFormFields: LoginFormFields
): Promise<PostLoginResponse | PostLoginError> => {
  const { username, password } = loginFormFields;

  const response = await api.post<PostLoginResponse>(ApiEndpoint.LOGIN, {
    username,
    password,
  });
  return response.data;
};

export const postSessionRecovery = async (
  jwt: string
): Promise<PostLoginResponse | PostLoginError> => {
  const response = await api.post<PostLoginResponse>(
    ApiEndpoint.SESSION_RESTORE,
    {
      jwt,
    }
  );
  return response.data;
};
