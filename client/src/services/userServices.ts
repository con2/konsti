import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import {
  RegistrationFormFields,
  UpdateUserResponse,
  GetUserBySerialResponse,
  PostRegistrationResponse,
  GetUserResponse,
} from 'typings/user.typings';
import { ServerError } from 'typings/utils.typings';

export const postRegistration = async (
  registrationFormFields: RegistrationFormFields
): Promise<PostRegistrationResponse | ServerError> => {
  const { username, password, serial } = registrationFormFields;
  let response: AxiosResponse;
  try {
    response = await api.post<PostRegistrationResponse>('/user', {
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
    response = await api.get<GetUserResponse>('/user', {
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
    response = await api.get<GetUserBySerialResponse>('/user', {
      params: {
        serial,
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

export const updateUserPassword = async (
  username: string,
  serial: string,
  password: string,
  changePassword: boolean
): Promise<UpdateUserResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<UpdateUserResponse>('/user', {
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
