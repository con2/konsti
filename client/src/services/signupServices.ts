import { AxiosResponse, AxiosError } from "axios";
import { api } from "client/utils/api";
import { ServerError } from "shared/typings/api/errors";
import {
  ENTERED_GAME_ENDPOINT,
  SIGNUP_ENDPOINT,
} from "shared/constants/apiEndpoints";
import {
  DeleteEnteredGameParameters,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameParameters,
  PostEnteredGameResponse,
  PostSignupResponse,
  SignupData,
} from "shared/typings/api/signup";

export const postSignup = async (
  signupData: SignupData
): Promise<PostSignupResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostSignupResponse>(SIGNUP_ENDPOINT, {
      signupData,
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

export const postEnteredGame = async (
  requestData: PostEnteredGameParameters
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostEnteredGameParameters>(
      ENTERED_GAME_ENDPOINT,
      requestData
    );
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<PostEnteredGameError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};

export const deleteEnteredGame = async (
  requestData: DeleteEnteredGameParameters
): Promise<DeleteEnteredGameResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.delete<DeleteEnteredGameParameters>(
      ENTERED_GAME_ENDPOINT,
      { data: requestData }
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
