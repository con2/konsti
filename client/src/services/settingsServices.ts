import { api } from "client/utils/api";
import {
  SETTINGS_ENDPOINT,
  SIGNUP_MESSAGE_ENDPOINT,
} from "shared/constants/apiEndpoints";
import { ServerError } from "shared/typings/api/errors";
import {
  GetSettingsResponse,
  PostSettingsRequest,
  PostSettingsResponse,
  PostSignupMessageResponse,
} from "shared/typings/api/settings";
import { SignupMessage } from "shared/typings/models/settings";

export const getSettings = async (): Promise<
  GetSettingsResponse | ServerError
> => {
  const response = await api.get<GetSettingsResponse>(SETTINGS_ENDPOINT);
  return response.data;
};

export const postSettings = async (
  settings: PostSettingsRequest
): Promise<PostSettingsResponse | ServerError> => {
  const response = await api.post<PostSettingsResponse>(
    SETTINGS_ENDPOINT,
    settings
  );
  return response.data;
};

export const postSignupMessage = async (
  signupMessage: SignupMessage
): Promise<PostSignupMessageResponse | ServerError> => {
  const response = await api.post<PostSignupMessageResponse>(
    SIGNUP_MESSAGE_ENDPOINT,
    {
      signupMessage,
    }
  );
  return response.data;
};

export const deleteSignupMessage = async (
  gameId: string
): Promise<PostSignupMessageResponse | ServerError> => {
  const response = await api.delete<PostSignupMessageResponse>(
    SIGNUP_MESSAGE_ENDPOINT,
    {
      data: { gameId },
    }
  );
  return response.data;
};
