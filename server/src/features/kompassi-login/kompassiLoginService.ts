import {
  findUser,
  findUserByKompassiId,
  saveUser,
  updateUserEmailAddress,
  updateUserKompassiLoginStatus,
} from "server/features/user/userRepository";
import { createSerial } from "server/features/user/userUtils";
import { getJWT } from "server/utils/jwt";
import { logger } from "server/utils/logger";
import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { KompassiLoginError } from "shared/types/api/errors";
import {
  PostKompassiLoginResponse,
  PostVerifyKompassiLoginResponse,
  PostUpdateUserEmailAddressResponse,
} from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  KompassiProfile,
  KompassiProfileSchema,
  KompassiTokens,
  KompassiTokensSchema,
} from "server/features/kompassi-login/KompassiLoginTypes";
import { redactTokenValues } from "server/features/kompassi-login/kompassiLoginUtils";

export const getBaseUrl = (): string => {
  if (process.env.SETTINGS === "ci") {
    return "http://server:5000";
  }
  const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
  // The e2e Kompassi mock is served by this same backend on the default port
  // 5000. When PORT_OFFSET runs an instance on a shifted port, follow it so the
  // instance hits its own mock instead of another instance's port 5000. Real
  // Kompassi URLs (dev.kompassi.eu etc.) are left untouched
  const portOffset = Number(process.env.PORT_OFFSET) || 0;
  if (portOffset > 0 && baseUrl === "http://localhost:5000") {
    return `http://localhost:${5000 + portOffset}`;
  }
  return baseUrl;
};

export const clientId = process.env.KOMPASSI_CLIENT_ID ?? "";
const clientSecret = process.env.KOMPASSI_CLIENT_SECRET ?? "";
const accessGroups = new Set(["users"]);

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
    const response = await fetch(url, { method: "POST", headers, body });
    const responseData = await response.json();
    const result = KompassiTokensSchema.safeParse(responseData);
    if (!result.success) {
      logger.error(
        new Error(
          `Error validating getKompassiTokens response: status ${response.status}, body ${JSON.stringify(redactTokenValues(responseData))}`,
          { cause: result.error },
        ),
      );
      return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("Kompassi login: Error fetching token from Kompassi", {
        cause: error,
      }),
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
    const response = await fetch(url, { headers });
    const responseData = await response.json();
    const result = KompassiProfileSchema.safeParse(responseData);
    if (!result.success) {
      // Don't log the body here - a partially valid profile would contain PII
      logger.error(
        new Error(
          `Error validating getKompassiProfile response: status ${response.status}`,
          { cause: result.error },
        ),
      );
      return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("Kompassi login: Error fetching profile from Kompassi", {
        cause: error,
      }),
    );
    return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
  }
};

export const doKompassiLogin = async (
  code: string,
  origin: string,
): Promise<PostKompassiLoginResponse> => {
  const tokensResult = await getKompassiTokens(code, origin);
  if (!tokensResult.ok) {
    return {
      message: "Error getting tokens from Komapssi",
      status: "error",
      errorId: "unknown",
    };
  }
  const profileResult = await getKompassiProfile(
    tokensResult.value.access_token,
  );
  if (!profileResult.ok) {
    return {
      message: "Error getting user profile from Komapssi",
      status: "error",
      errorId: "unknown",
    };
  }
  const profile = profileResult.value;

  const groupNames = profile.groups.filter((groupName) =>
    accessGroups.has(groupName),
  );

  if (groupNames.length === 0) {
    return {
      message: "User not member of any group that would grant access",
      status: "error",
      errorId: "invalidUserGroup",
    };
  }

  const existingUserResult = await findUserByKompassiId(profile.id);
  if (!existingUserResult.ok) {
    return {
      message: "Error finding existing user",
      status: "error",
      errorId: "loginFailed",
    };
  }
  const existingUser = existingUserResult.value;

  if (existingUser) {
    return {
      message: "User login success",
      status: "success",
      username: existingUser.username,
      userGroup: existingUser.userGroup,
      serial: existingUser.serial,
      groupCode: existingUser.groupCode,
      isGroupCreator: existingUser.isGroupCreator,
      jwt: getJWT(existingUser.userGroup, existingUser.username),
      eventLogItems: existingUser.eventLogItems,
      kompassiUsernameAccepted: existingUser.kompassiUsernameAccepted,
      kompassiId: existingUser.kompassiId,
      email: existingUser.email || "",
      emailNotificationPermitAsked: existingUser.emailNotificationPermitAsked,
    };
  }

  const serialDocResult = await createSerial();
  if (!serialDocResult.ok) {
    return {
      message: "Error creating serial for new user",
      status: "error",
      errorId: "loginFailed",
    };
  }
  const serial = serialDocResult.value[0].serial;

  // Check if username already taken
  const findUserResult = await findUser(profile.username);
  if (!findUserResult.ok) {
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }
  const userWithSameUsername = findUserResult.value;

  const saveUserResult = await saveUser({
    kompassiId: profile.id,
    // TODO: Handle properly instead of appending profile.id to username
    username: userWithSameUsername
      ? `${profile.username}-${profile.id}`
      : profile.username,
    serial,
    email: profile.email,
    passwordHash: "",
    userGroup: UserGroup.USER,
    groupCode: "0",
  });
  if (!saveUserResult.ok) {
    return {
      message: "Saving user failed",
      status: "error",
      errorId: "loginFailed",
    };
  }
  const saveUserResponse = saveUserResult.value;

  logger.info(`Kompassi login: Saved new user ${saveUserResponse.username}`);

  return {
    message: "User login success",
    status: "success",
    username: saveUserResponse.username,
    userGroup: saveUserResponse.userGroup,
    serial: saveUserResponse.serial,
    groupCode: saveUserResponse.groupCode,
    isGroupCreator: saveUserResponse.isGroupCreator,
    jwt: getJWT(saveUserResponse.userGroup, saveUserResponse.username),
    eventLogItems: saveUserResponse.eventLogItems,
    kompassiUsernameAccepted: saveUserResponse.kompassiUsernameAccepted,
    kompassiId: saveUserResponse.kompassiId,
    email: saveUserResponse.email || "",
    emailNotificationPermitAsked: saveUserResponse.emailNotificationPermitAsked,
  };
};

export const verifyKompassiLogin = async (
  oldUsername: string,
  newUsername: string,
): Promise<PostVerifyKompassiLoginResponse> => {
  if (oldUsername !== newUsername) {
    // Check if username already taken
    const findUserResult = await findUser(newUsername);
    if (!findUserResult.ok) {
      return {
        errorId: "unknown",
        message: "Finding user failed",
        status: "error",
      };
    }

    const existingUser = findUserResult.value;

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
  if (!userResult.ok) {
    return {
      message: "Updating Kompassi login status failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = userResult.value;

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

export const verifyUpdateUserEmailAddress = async (
  username: string,
  email: string,
): Promise<PostUpdateUserEmailAddressResponse> => {
  const userResult = await updateUserEmailAddress(username, email);
  if (!userResult.ok) {
    return {
      message: "Updating user email address failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = userResult.value;

  return {
    message: "Email address updated successfully",
    status: "success",
    email: user.email,
    emailNotificationPermitAsked: user.emailNotificationPermitAsked,
    jwt: getJWT(user.userGroup, user.username),
  };
};
