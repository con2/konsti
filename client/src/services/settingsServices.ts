import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import {
  ServerError,
  GetSettingsResponse,
  PostToggleAppOpenResponse,
} from 'typings/utils.typings';

export const getSettings = async (): Promise<
  GetSettingsResponse | ServerError
> => {
  let response: AxiosResponse;
  try {
    response = await api.get<GetSettingsResponse>('/settings');
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
    response = await api.post<PostToggleAppOpenResponse>('/toggle-app-open', {
      appOpen,
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
