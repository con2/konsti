import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/typings/api/errors";
import {
  GetSettingsResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupMessageResponse,
} from "shared/typings/api/settings";
import { SignupMessage } from "shared/typings/models/settings";

export interface GetSettingsParams {
  includePrivateMessages: boolean;
}

export const getSettings = async ({
  includePrivateMessages,
}: GetSettingsParams): Promise<GetSettingsResponse | ApiError> => {
  const response = await api.get<GetSettingsResponse>(ApiEndpoint.SETTINGS, {
    params: {
      includePrivateMessages,
    },
  });
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

export const postSignupMessage = async (
  signupMessage: SignupMessage
): Promise<PostSignupMessageResponse | ApiError> => {
  const response = await api.post<PostSignupMessageResponse>(
    ApiEndpoint.SIGNUP_MESSAGE,
    {
      signupMessage,
    }
  );
  return response.data;
};

export const deleteSignupMessage = async (
  gameId: string
): Promise<PostSignupMessageResponse | ApiError> => {
  const response = await api.delete<PostSignupMessageResponse>(
    ApiEndpoint.SIGNUP_MESSAGE,
    {
      data: { gameId },
    }
  );
  return response.data;
};
