import axios from "axios";
import {
  findUserByKompassiId,
  saveUser,
} from "server/features/user/userRepository";
import { createSerial } from "server/features/user/userUtils";
import { getJWT } from "server/utils/jwt";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  PostKompassiLoginResponse,
  PostKompassiLoginError,
} from "shared/typings/api/login";
import { UserGroup } from "shared/typings/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";

const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
const clientSecret = process.env.KOMPASSI_CLIENT_SECRET ?? "";
const accessGroups = ["users"];

interface Profile {
  id: number;
  first_name: string;
  surname: string;
  full_name: string;
  groups: string[];
  email: string;
  username: string;
}

export const getProfile = async (accessToken: string): Promise<Profile> => {
  const url = `${baseUrl}/api/v2/people/me`;
  const headers = { authorization: `Bearer ${accessToken}` };

  const response = await axios.get(url, { headers });
  return response.data;
};

export const getAuthUrl = (origin: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_CALLBACK}`,
    scope: "read",
  });

  return `${baseUrl}/oauth2/authorize?${params.toString()}`;
};

interface Token {
  access_token: string;
  refresh_token: string;
}

export const getToken = async (
  code: string,
  origin: string,
): Promise<Token> => {
  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_CALLBACK}`,
  });
  const body = params.toString();
  const url = `${baseUrl}/oauth2/token`;
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };

  const response = await axios.post(url, body, { headers });
  return response.data;
};

export const parseProfile = async (
  profile: Profile,
): Promise<PostKompassiLoginResponse | PostKompassiLoginError> => {
  const groupNames = profile.groups.filter((groupName) =>
    accessGroups.includes(groupName),
  );

  if (groupNames.length === 0) {
    return {
      message: "User not member of any group that would grant access",
      status: "error",
      errorId: "invalidUserGroup",
    };
  }

  const existingUserResult = await findUserByKompassiId(profile.id);
  if (isErrorResult(existingUserResult)) {
    return {
      message: "Error finding existing user",
      status: "error",
      errorId: "loginFailed",
    };
  }

  const existingUser = unwrapResult(existingUserResult);

  if (existingUser) {
    return {
      message: "User login success",
      status: "success",
      username: existingUser.username,
      userGroup: existingUser.userGroup,
      serial: existingUser.serial,
      groupCode: existingUser.groupCode,
      jwt: getJWT(existingUser.userGroup, existingUser.username),
      eventLogItems: existingUser.eventLogItems,
    };
  }

  const serialDocResult = await createSerial();
  if (isErrorResult(serialDocResult)) {
    return {
      message: "Error creating serial for new user",
      status: "error",
      errorId: "loginFailed",
    };
  }
  const serialDoc = unwrapResult(serialDocResult);
  const serial = serialDoc[0].serial;

  const saveUserResult = await saveUser({
    kompassiId: profile.id,
    username: profile.username,
    serial,
    passwordHash: "",
    userGroup: UserGroup.USER,
    groupCode: "0",
  });

  if (isErrorResult(saveUserResult)) {
    return {
      message: "Saving user failed",
      status: "error",
      errorId: "loginFailed",
    };
  }

  const saveUserResponse = unwrapResult(saveUserResult);

  return {
    message: "User login success",
    status: "success",
    username: saveUserResponse.username,
    userGroup: saveUserResponse.userGroup,
    serial: saveUserResponse.serial,
    groupCode: saveUserResponse.groupCode,
    jwt: getJWT(saveUserResponse.userGroup, saveUserResponse.username),
    eventLogItems: saveUserResponse.eventLogItems,
  };
};
