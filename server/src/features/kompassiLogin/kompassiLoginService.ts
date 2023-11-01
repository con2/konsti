import axios from "axios";
import {
  findUser,
  findUserByKompassiId,
  saveUser,
  updateUserKompassiLoginStatus,
} from "server/features/user/userRepository";
import { createSerial } from "server/features/user/userUtils";
import { getJWT } from "server/utils/jwt";
import { logger } from "server/utils/logger";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { KompassiLoginError } from "shared/typings/api/errors";
import {
  PostKompassiLoginResponse,
  PostKompassiLoginError,
  PostVerifyKompassiLoginError,
  PostVerifyKompassiLoginResponse,
} from "shared/typings/api/login";
import { UserGroup } from "shared/typings/models/user";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
export const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
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

const getProfile = async (
  accessToken: string,
): Promise<Result<Profile, KompassiLoginError>> => {
  const url = `${baseUrl}/api/v2/people/me`;
  const headers = { authorization: `Bearer ${accessToken}` };

  try {
    const response = await axios.get(url, { headers });
    return makeSuccessResult(response.data);
  } catch (error) {
    logger.error(
      "Kompassi login: Error fetching profile from Kompassi: %s",
      error,
    );
    return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
  }
};

interface Tokens {
  access_token: string;
  refresh_token: string;
}

const getTokens = async (
  code: string,
  origin: string,
): Promise<Result<Tokens, KompassiLoginError>> => {
  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`,
  });
  const body = params.toString();
  const url = `${baseUrl}/oauth2/token`;
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(url, body, { headers });
    return makeSuccessResult(response.data);
  } catch (error) {
    logger.error(
      "Kompassi login: Error fetching token from Kompassi: %s",
      error,
    );
    return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
  }
};

export const doKompassiLogin = async (
  code: string,
  origin: string,
): Promise<PostKompassiLoginResponse | PostKompassiLoginError> => {
  const tokensResult = await getTokens(code, origin);
  if (isErrorResult(tokensResult)) {
    return {
      message: "Error getting tokens from Komapssi",
      status: "error",
      errorId: "unknown",
    };
  }
  const tokens = unwrapResult(tokensResult);

  const profileResult = await getProfile(tokens.access_token);
  if (isErrorResult(profileResult)) {
    return {
      message: "Error getting user profile from Komapssi",
      status: "error",
      errorId: "unknown",
    };
  }
  const profile = unwrapResult(profileResult);

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
      groupCreatorCode: existingUser.groupCreatorCode,
      jwt: getJWT(existingUser.userGroup, existingUser.username),
      eventLogItems: existingUser.eventLogItems,
      kompassiUsernameAccepted: existingUser.kompassiUsernameAccepted,
      kompassiId: existingUser.kompassiId,
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
    groupCreatorCode: saveUserResponse.groupCreatorCode,
    jwt: getJWT(saveUserResponse.userGroup, saveUserResponse.username),
    eventLogItems: saveUserResponse.eventLogItems,
    kompassiUsernameAccepted: saveUserResponse.kompassiUsernameAccepted,
    kompassiId: saveUserResponse.kompassiId,
  };
};

export const verifyKompassiLogin = async (
  oldUsername: string,
  newUsername: string,
): Promise<PostVerifyKompassiLoginResponse | PostVerifyKompassiLoginError> => {
  // Check if user already exists
  const findUserResult = await findUser(newUsername);
  if (isErrorResult(findUserResult)) {
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }

  const existingUser = unwrapResult(findUserResult);

  if (existingUser) {
    logger.info(
      `Kompassi verify: Username ${existingUser.userGroup} is already registered`,
    );
    return {
      errorId: "usernameNotFree",
      message: "Username in already registered",
      status: "error",
    };
  }

  const userResult = await updateUserKompassiLoginStatus(
    oldUsername,
    newUsername,
  );
  if (isErrorResult(userResult)) {
    return {
      message: "Updating Kompassi login status failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = unwrapResult(userResult);

  return {
    message: "Kompassi login status updated",
    status: "success",
    username: user.username,
    kompassiUsernameAccepted: user.kompassiUsernameAccepted,
    jwt: getJWT(user.userGroup, user.username),
  };
};
