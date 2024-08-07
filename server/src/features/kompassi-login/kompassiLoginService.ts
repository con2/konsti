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
import { KompassiLoginError } from "shared/types/api/errors";
import {
  PostKompassiLoginResponse,
  PostKompassiLoginError,
  PostVerifyKompassiLoginError,
  PostVerifyKompassiLoginResponse,
} from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import {
  KompassiProfile,
  KompassiProfileSchema,
  KompassiTokens,
  KompassiTokensSchema,
} from "server/features/kompassi-login/KompassiLoginTypes";

export const getBaseUrl = (): string => {
  if (process.env.SETTINGS === "ci") {
    return "http://server:5000";
  }
  return process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
};

export const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
const clientSecret = process.env.KOMPASSI_CLIENT_SECRET ?? "";
const accessGroups = ["users"];

const getKompassiTokens = async (
  code: string,
  origin: string,
): Promise<Result<KompassiTokens, KompassiLoginError>> => {
  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`,
  });
  const body = params.toString();
  const url = `${getBaseUrl()}/oauth2/token`;
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post<unknown>(url, body, { headers });
    const result = KompassiTokensSchema.safeParse(response.data);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Error validating getKompassiTokens response: ${result.error}`,
        ),
      );
      return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      "Kompassi login: Error fetching token from Kompassi: %s",
      error,
    );
    return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
  }
};

const getKompassiProfile = async (
  accessToken: string,
): Promise<Result<KompassiProfile, KompassiLoginError>> => {
  const url = `${getBaseUrl()}/api/v2/people/me`;
  const headers = { authorization: `Bearer ${accessToken}` };

  try {
    const response = await axios.get<unknown>(url, { headers });
    const result = KompassiProfileSchema.safeParse(response.data);
    if (!result.success) {
      logger.error(
        "%s",
        new Error(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Error validating getKompassiProfile response: ${result.error}`,
        ),
      );
      return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      "Kompassi login: Error fetching profile from Kompassi: %s",
      error,
    );
    return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
  }
};

export const doKompassiLogin = async (
  code: string,
  origin: string,
): Promise<PostKompassiLoginResponse | PostKompassiLoginError> => {
  const tokensResult = await getKompassiTokens(code, origin);
  if (isErrorResult(tokensResult)) {
    return {
      message: "Error getting tokens from Komapssi",
      status: "error",
      errorId: "unknown",
    };
  }
  const tokens = unwrapResult(tokensResult);

  const profileResult = await getKompassiProfile(tokens.access_token);
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

  // Check if username already taken
  const findUserResult = await findUser(profile.username);
  if (isErrorResult(findUserResult)) {
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }
  const userWithSameUsername = unwrapResult(findUserResult);

  const saveUserResult = await saveUser({
    kompassiId: profile.id,
    // TODO: Handle properly instead of appending profile.id to username
    username: userWithSameUsername
      ? `${profile.username}-${profile.id}`
      : profile.username,
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

  logger.info(`Kompassi login: Saved new user ${saveUserResponse.username}`);

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
  if (oldUsername !== newUsername) {
    // Check if username already taken
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
        `Kompassi verify: Username ${existingUser.username} is already registered`,
      );
      return {
        errorId: "usernameNotFree",
        message: "Username in already registered",
        status: "error",
      };
    }
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

  logger.info(
    `Kompassi login: username ${oldUsername} changed to ${newUsername}`,
  );

  return {
    message: "Kompassi login status updated",
    status: "success",
    username: user.username,
    kompassiUsernameAccepted: user.kompassiUsernameAccepted,
    jwt: getJWT(user.userGroup, user.username),
  };
};
