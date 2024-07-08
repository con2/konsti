import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
  GetUserBySerialRequest,
  GetUserBySerialResponse,
  GetUserResponse,
  PostUpdateUserPasswordRequest,
  PostUpdateUserPasswordResponse,
  PostUserError,
  PostUserRequest,
  PostUserResponse,
} from "shared/types/api/users";
import { RegistrationFormFields } from "client/views/registration/components/RegistrationForm";
import {
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/types/api/eventLog";

export const postRegistration = async (
  registrationFormFields: RegistrationFormFields,
): Promise<PostUserResponse | PostUserError> => {
  const { username, password, serial } = registrationFormFields;

  const response = await api.post<PostUserResponse, PostUserRequest>(
    ApiEndpoint.USERS,
    {
      username,
      password,
      serial,
    },
  );
  return response.data;
};

export const getUser = async (
  username: string,
): Promise<GetUserResponse | ApiError> => {
  const response = await api.get<GetUserResponse, {}>(ApiEndpoint.USERS, {
    params: {
      username,
    },
  });
  return response.data;
};

export const getUserBySerialOrUsername = async (
  searchTerm: string,
): Promise<GetUserBySerialResponse | ApiError> => {
  const response = await api.get<
    GetUserBySerialResponse,
    GetUserBySerialRequest
  >(ApiEndpoint.USERS_BY_SERIAL_OR_USERNAME, {
    params: {
      searchTerm,
    },
  });
  return response.data;
};

export const updateUserPassword = async (
  userToUpdateUsername: string,
  password: string,
): Promise<PostUpdateUserPasswordResponse | ApiError> => {
  const response = await api.post<
    PostUpdateUserPasswordResponse,
    PostUpdateUserPasswordRequest
  >(ApiEndpoint.USERS_PASSWORD, {
    userToUpdateUsername,
    password,
  });
  return response.data;
};

export const getSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  const response = await api.get<GetSignupMessagesResponse, {}>(
    ApiEndpoint.SIGNUP_MESSAGE,
  );
  return response.data;
};

export const postEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
): Promise<PostEventLogIsSeenResponse | ApiError> => {
  const response = await api.post<
    PostEventLogIsSeenResponse,
    PostEventLogIsSeenRequest
  >(ApiEndpoint.EVENT_LOG_IS_SEEN, request);
  return response.data;
};
