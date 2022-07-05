import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/typings/api/errors";
import {
  GetSettingsResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupQuestionResponse,
} from "shared/typings/api/settings";
import { SignupQuestion } from "shared/typings/models/settings";

export const getSettings = async (): Promise<
  GetSettingsResponse | ApiError
> => {
  const response = await api.get<GetSettingsResponse>(ApiEndpoint.SETTINGS);
  return response.data;
};

export const postSettings = async (
  settings: PostSettingsRequest
): Promise<PostSettingsResponse | ApiError> => {
  const response = await api.post<PostSettingsResponse>(
    ApiEndpoint.SETTINGS,
    settings
  );
  return response.data;
};

export const postSignupQuestion = async (
  signupQuestion: SignupQuestion
): Promise<PostSignupQuestionResponse | ApiError> => {
  const response = await api.post<PostSignupQuestionResponse>(
    ApiEndpoint.SIGNUP_QUESTION,
    {
      signupQuestion,
    }
  );
  return response.data;
};

export const deleteSignupQuestion = async (
  gameId: string
): Promise<PostSignupQuestionResponse | ApiError> => {
  const response = await api.delete<PostSignupQuestionResponse>(
    ApiEndpoint.SIGNUP_QUESTION,
    {
      data: { gameId },
    }
  );
  return response.data;
};
