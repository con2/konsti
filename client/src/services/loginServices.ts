import { api } from "client/utils/api";
import { LoginFormFields } from "client/views/login/components/LocalLoginForm";
import { ApiEndpoint, AuthEndpoint } from "shared/constants/apiEndpoints";
import { saveKompassiLoginState } from "client/utils/sessionStorage";
import {
  PostKompassiLoginRedirectRequest,
  PostKompassiLoginRequest,
  PostKompassiLoginResponse,
  PostLoginRequest,
  PostLoginResponse,
  PostSessionRecoveryRequest,
  PostSessionRecoveryResponse,
  PostUpdateUserEmailAddressRequest,
  PostUpdateUserEmailAddressResponse,
  PostVerifyKompassiLoginRequest,
  PostVerifyKompassiLoginResponse,
} from "shared/types/api/login";

export const postLogin = async (
  loginFormFields: LoginFormFields,
): Promise<PostLoginResponse> => {
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
): Promise<PostSessionRecoveryResponse> => {
  const response = await api.post<
    PostSessionRecoveryResponse,
    PostSessionRecoveryRequest
  >(ApiEndpoint.SESSION_RESTORE, {
    jwt,
  });
  return response.data;
};

// getRandomValues rather than randomUUID: the latter is only available in
// secure contexts, and the app is served over plain http in local and
// containerized runs
const generateLoginState = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

// The state is generated and kept here rather than server-side so that any
// server instance can serve the callback, and is checked against the value
// Kompassi echoes back before the code is exchanged
export const postKompassiLoginRedirect = async (): Promise<void> => {
  const state = generateLoginState();
  saveKompassiLoginState(state);
  await api.post<unknown, PostKompassiLoginRedirectRequest>(
    AuthEndpoint.KOMPASSI_LOGIN,
    { state },
  );
};

export const postKompassiLogoutRedirect = async (): Promise<void> => {
  await api.post(AuthEndpoint.KOMPASSI_LOGOUT);
};

export const postKompassiLoginCallback = async (
  code: string,
): Promise<PostKompassiLoginResponse> => {
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
): Promise<PostVerifyKompassiLoginResponse> => {
  const response = await api.post<
    PostVerifyKompassiLoginResponse,
    PostVerifyKompassiLoginRequest
  >(ApiEndpoint.VERIFY_KOMPASSI_LOGIN, {
    username,
  });
  return response.data;
};

export const postUpdateUserEmailAddress = async (
  email: string,
): Promise<PostUpdateUserEmailAddressResponse> => {
  const response = await api.post<
    PostUpdateUserEmailAddressResponse,
    PostUpdateUserEmailAddressRequest
  >(ApiEndpoint.UPDATE_USER_EMAIL_ADDRESS, {
    email,
  });
  return response.data;
};
