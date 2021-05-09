import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { ServerError } from 'shared/typings/api/errors';
import {
  USERS_BY_SERIAL_ENDPOINT,
  USERS_ENDPOINT,
} from 'shared/constants/apiEndpoints';
import {
  GetUserBySerialResponse,
  GetUserResponse,
  PostUserResponse,
} from 'shared/typings/api/users';
import { RegistrationFormFields } from 'shared/typings/api/login';

export const postRegistration = async (
  registrationFormFields: RegistrationFormFields
): Promise<PostUserResponse | ServerError> => {
  const { username, password, serial } = registrationFormFields;
  let response: AxiosResponse;
  try {
    response = await api.post<PostUserResponse>(USERS_ENDPOINT, {
      username,
      password,
      serial,
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

export const getUser = async (
  username: string
): Promise<GetUserResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.get<GetUserResponse>(USERS_ENDPOINT, {
      params: {
        username,
      },
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

export const getUserBySerial = async (
  serial: string
): Promise<GetUserBySerialResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.get<GetUserBySerialResponse>(
      USERS_BY_SERIAL_ENDPOINT,
      {
        params: {
          serial,
        },
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

export const updateUserPassword = async (
  username: string,
  serial: string,
  password: string,
  changePassword: boolean
): Promise<PostUserResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostUserResponse>(USERS_ENDPOINT, {
      username,
      serial,
      password,
      changePassword,
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
