import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetUserBySerialResponse,
  GetUserResponse,
  PostUserError,
  PostUserRequest,
  PostUserResponse,
} from "shared/typings/api/users";
import { RegistrationFormFields } from "client/views/registration/components/RegistrationForm";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
} from "shared/typings/models/signupMessage";

export const postRegistration = async (
  registrationFormFields: RegistrationFormFields
): Promise<PostUserResponse | PostUserError> => {
  const { username, password, serial } = registrationFormFields;

  const response = await api.post<PostUserResponse, PostUserRequest>(
    ApiEndpoint.USERS,
    {
      username,
      password,
      serial,
    }
  );
  return response.data;
};

export const getUser = async (
  username: string
): Promise<GetUserResponse | ApiError> => {
  const response = await api.get<GetUserResponse>(ApiEndpoint.USERS, {
    params: {
      username,
    },
  });
  return response.data;
};

export const getUserBySerialOrUsername = async (
  searchTerm: string
): Promise<GetUserBySerialResponse | ApiError> => {
  const response = await api.get<GetUserBySerialResponse>(
    ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME,
    {
      params: {
        searchTerm,
      },
    }
  );
  return response.data;
};

export const updateUserPassword = async (
  username: string,
  password: string,
  requester: string
): Promise<PostUserResponse | ApiError> => {
  const response = await api.post<PostUserResponse>(
    ApiEndpoint.USERS_PASSWORD,
    {
      username,
      password,
      requester,
    }
  );
  return response.data;
};

export const getSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  const response = await api.get<GetSignupMessagesResponse>(
    ApiEndpoint.SIGNUP_MESSAGE
  );
  return response.data;
};
