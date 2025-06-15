import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetSignupMessagesError,
  GetSignupMessagesResponse,
  GetUserBySerialError,
  GetUserBySerialRequest,
  GetUserBySerialResponse,
  GetUserError,
  GetUserResponse,
  PostUpdateUserPasswordError,
  PostUpdateUserPasswordRequest,
  PostUpdateUserPasswordResponse,
  PostUserError,
  PostUserRequest,
  PostUserResponse,
} from "shared/types/api/users";
import { KonstiRegistrationFormFields } from "client/views/registration/components/KonstiRegistrationPage";
import {
  PostEventLogIsSeenError,
  PostEventLogIsSeenRequest,
  PostEventLogIsSeenResponse,
} from "shared/types/api/eventLog";

export const postRegistration = async (
  registrationFormFields: KonstiRegistrationFormFields,
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

interface GetUserParams {
  username: string;
}

export const getUser = async (
  username: string,
): Promise<GetUserResponse | GetUserError> => {
  const response = await api.get<GetUserResponse, GetUserParams>(
    ApiEndpoint.USERS,
    {
      params: {
        username,
      },
    },
  );
  return response.data;
};

export const getUserBySerialOrUsername = async (
  searchTerm: string,
): Promise<GetUserBySerialResponse | GetUserBySerialError> => {
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
  usernameToUpdate: string,
  password: string,
): Promise<PostUpdateUserPasswordResponse | PostUpdateUserPasswordError> => {
  const response = await api.post<
    PostUpdateUserPasswordResponse,
    PostUpdateUserPasswordRequest
  >(ApiEndpoint.USERS_PASSWORD, {
    usernameToUpdate,
    password,
  });
  return response.data;
};

export const getSignupMessages = async (): Promise<
  GetSignupMessagesResponse | GetSignupMessagesError
> => {
  const response = await api.get<GetSignupMessagesResponse>(
    ApiEndpoint.SIGNUP_MESSAGE,
  );
  return response.data;
};

export const postEventLogItemIsSeen = async (
  request: PostEventLogIsSeenRequest,
): Promise<PostEventLogIsSeenResponse | PostEventLogIsSeenError> => {
  const response = await api.post<
    PostEventLogIsSeenResponse,
    PostEventLogIsSeenRequest
  >(ApiEndpoint.EVENT_LOG_IS_SEEN, request);
  return response.data;
};
