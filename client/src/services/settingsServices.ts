import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteSignupQuestionRequest,
  DeleteSignupQuestionResponse,
  GetSettingsResponse,
  DeleteSignupQuestionError,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupQuestionError,
  PostSignupQuestionRequest,
  PostSignupQuestionResponse,
  PostSettingsError,
  GetSettingsError,
} from "shared/types/api/settings";
import { SignupQuestion } from "shared/types/models/settings";

export const getSettings = async (): Promise<
  GetSettingsResponse | GetSettingsError
> => {
  const response = await api.get<GetSettingsResponse>(ApiEndpoint.SETTINGS);
  return response.data;
};

export const postSettings = async (
  settings: PostSettingsRequest,
): Promise<PostSettingsResponse | PostSettingsError> => {
  const response = await api.post<PostSettingsResponse, PostSettingsRequest>(
    ApiEndpoint.SETTINGS,
    settings,
  );
  return response.data;
};

export const postSignupQuestion = async (
  signupQuestion: SignupQuestion,
): Promise<PostSignupQuestionResponse | PostSignupQuestionError> => {
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
): Promise<DeleteSignupQuestionResponse | DeleteSignupQuestionError> => {
  const response = await api.delete<
    DeleteSignupQuestionResponse,
    DeleteSignupQuestionRequest
  >(ApiEndpoint.SIGNUP_QUESTION, {
    data: { programItemId },
  });
  return response.data;
};
