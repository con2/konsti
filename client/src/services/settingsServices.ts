import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/types/api/errors";
import {
  DeleteSignupQuestionRequest,
  DeleteSignupQuestionResponse,
  GetSettingsResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupQuestionRequest,
  PostSignupQuestionResponse,
} from "shared/types/api/settings";
import { SignupQuestion } from "shared/types/models/settings";

export const getSettings = async (): Promise<
  GetSettingsResponse | ApiError
> => {
  const response = await api.get<GetSettingsResponse>(ApiEndpoint.SETTINGS);
  return response.data;
};

export const postSettings = async (
  settings: PostSettingsRequest,
): Promise<PostSettingsResponse | ApiError> => {
  const response = await api.post<PostSettingsResponse, PostSettingsRequest>(
    ApiEndpoint.SETTINGS,
    settings,
  );
  return response.data;
};

export const postSignupQuestion = async (
  signupQuestion: SignupQuestion,
): Promise<PostSignupQuestionResponse | ApiError> => {
  const response = await api.post<
    PostSignupQuestionResponse,
    PostSignupQuestionRequest
  >(ApiEndpoint.SIGNUP_QUESTION, {
    signupQuestion,
  });
  return response.data;
};

export const deleteSignupQuestion = async (
  programItemId: string,
): Promise<DeleteSignupQuestionResponse | ApiError> => {
  const response = await api.delete<
    DeleteSignupQuestionResponse,
    DeleteSignupQuestionRequest
  >(ApiEndpoint.SIGNUP_QUESTION, {
    data: { programItemId },
  });
  return response.data;
};
