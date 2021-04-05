import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import {
  GetSettingsResponse,
  PostToggleAppOpenResponse,
} from 'client/typings/utils.typings';
import {
  SETTINGS_ENDPOINT,
  TOGGLE_APP_OPEN_ENDPOINT,
} from 'shared/constants/apiEndpoints';
import { ServerError } from 'shared/typings/api/errors';

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
