import { AxiosResponse, AxiosError } from "axios";
import { api } from "client/utils/api";
import {
  SETTINGS_ENDPOINT,
  SIGNUP_MESSAGE_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { ServerError } from "shared/typings/api/errors";
import {
  GetSettingsResponse,
  PostSignupMessageResponse,
  PostToggleAppOpenResponse,
} from "shared/typings/api/settings";
import { SignupMessage } from "shared/typings/models/settings";

export const getSettings = async (): Promise<
  GetSettingsResponse | ServerError
> => {
  let response: AxiosResponse;
  try {
    response = await api.get<GetSettingsResponse>(SETTINGS_ENDPOINT);
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};

export const postToggleAppOpen = async (
  appOpen: boolean
): Promise<PostToggleAppOpenResponse | ServerError> => {
  let response;
  try {
    response = await api.post<PostToggleAppOpenResponse>(
      TOGGLE_APP_OPEN_ENDPOINT,
      {
        appOpen,
      }
    );
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};

export const postSignupMessage = async (
  signupMessage: SignupMessage
): Promise<PostSignupMessageResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostSignupMessageResponse>(
      SIGNUP_MESSAGE_ENDPOINT,
      {
        signupMessage,
      }
    );
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};

export const deleteSignupMessage = async (
  gameId: string
): Promise<PostSignupMessageResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.delete<PostSignupMessageResponse>(
      SIGNUP_MESSAGE_ENDPOINT,
      {
        data: { gameId },
      }
    );
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
