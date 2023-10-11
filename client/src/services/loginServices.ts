import { api } from "client/utils/api";
import { LoginFormFields } from "client/views/login/components/LoginForm";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  PostKompassiLoginError,
  PostKompassiLoginRequest,
  PostKompassiLoginResponse,
  PostLoginError,
  PostLoginRequest,
  PostLoginResponse,
  PostSessionRecoveryRequest,
  PostSessionRecoveryResponse,
} from "shared/typings/api/login";

export const postLogin = async (
  loginFormFields: LoginFormFields,
): Promise<PostLoginResponse | PostLoginError> => {
  const { username, password } = loginFormFields;

  const response = await api.post<PostLoginResponse, PostLoginRequest>(
    ApiEndpoint.LOGIN,
    {
      username,
      password,
    },
  );
  return response.data;
};

export const postSessionRecovery = async (
  jwt: string,
): Promise<PostLoginResponse | PostLoginError> => {
  const response = await api.post<
    PostSessionRecoveryResponse,
    PostSessionRecoveryRequest
  >(ApiEndpoint.SESSION_RESTORE, {
    jwt,
  });
  return response.data;
};

export const getKompassiLoginRedirectUrl = async (): Promise<void> => {
  await api.get(AuthEndpoint.KOMPASSI_LOGIN);
};

export const postKompassiLoginCallback = async (
  code: string,
): Promise<PostKompassiLoginResponse | PostKompassiLoginError> => {
  const response = await api.post<
    PostKompassiLoginResponse,
    PostKompassiLoginRequest
  >(AuthEndpoint.KOMPASSI_CALLBACK, {
    code,
  });
  return response.data;
};
