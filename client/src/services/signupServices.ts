import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
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
): Promise<PostSignupResponse | ApiError> => {
  const response = await api.post<PostSignupResponse>(SIGNUP_ENDPOINT, {
    signupData,
  });
  return response.data;
};

export const postEnteredGame = async (
  requestData: PostEnteredGameParameters
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  const response = await api.post<PostEnteredGameResponse>(
    ENTERED_GAME_ENDPOINT,
    requestData
  );
  return response.data;
};

export const deleteEnteredGame = async (
  requestData: DeleteEnteredGameParameters
): Promise<DeleteEnteredGameResponse | ApiError> => {
  const response = await api.delete<DeleteEnteredGameResponse>(
    ENTERED_GAME_ENDPOINT,
    { data: requestData }
  );
  return response.data;
};
