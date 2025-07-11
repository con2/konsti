import { api } from "client/utils/api";
import { LoginFormFields } from "client/views/login/components/LocalLoginForm";
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
  PostVerifyKompassiLoginError,
  PostVerifyKompassiLoginRequest,
  PostVerifyKompassiLoginResponse,
} from "shared/types/api/login";

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

export const postKompassiLoginRedirect = async (): Promise<void> => {
  await api.post(AuthEndpoint.KOMPASSI_LOGIN);
};

export const postKompassiLogoutRedirect = async (): Promise<void> => {
  await api.post(AuthEndpoint.KOMPASSI_LOGOUT);
};

export const postKompassiLoginCallback = async (
  code: string,
): Promise<PostKompassiLoginResponse | PostKompassiLoginError> => {
  const response = await api.post<
    PostKompassiLoginResponse,
    PostKompassiLoginRequest
  >(AuthEndpoint.KOMPASSI_LOGIN_CALLBACK, {
    code,
  });
  return response.data;
};

export const postVerifyKompassiLogin = async (
  username: string,
): Promise<PostVerifyKompassiLoginResponse | PostVerifyKompassiLoginError> => {
  const response = await api.post<
    PostVerifyKompassiLoginResponse,
    PostVerifyKompassiLoginRequest
  >(ApiEndpoint.VERIFY_KOMPASSI_LOGIN, {
    username,
  });
  return response.data;
};
