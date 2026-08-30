import { AuthEndpoint } from "shared/constants/apiEndpoints";
import { EMAIL_REGEX } from "shared/constants/validation";
import { KompassiLoginError, MongoDbError } from "shared/types/api/errors";
import {
  PostKompassiLoginResponse,
  PostUpdateUserEmailAddressResponse,
  PostVerifyKompassiLoginResponse,
} from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import {
  KompassiTokens,
  KompassiTokensSchema,
  KompassiUserinfo,
  KompassiUserinfoSchema,
} from "server/features/kompassi-login/KompassiLoginTypes";
import {
  addKompassiIdSuffix,
  deriveKonstiUsername,
  redactTokenValues,
} from "server/features/kompassi-login/kompassiLoginUtils";
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

export const getBaseUrl = (): string => {
  if (process.env.SETTINGS === "ci") {
    return "http://server:5000";
  }
  const baseUrl = process.env.KOMPASSI_BASE_URL ?? "https://kompassi.eu";
  // The e2e Kompassi mock is served by this same backend on the default port
  // 5000. When PORT_OFFSET runs an instance on a shifted port, follow it so the
  // instance hits its own mock instead of another instance's port 5000. Real
  // Kompassi URLs (dev.kompassi.eu etc.) are left untouched.
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
  // The trailing slash matters - Django redirects a slash-less POST, which
  // would downgrade it to a GET
  const url = `${getBaseUrl()}/oidc/token/`;
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

const getKompassiUserinfo = async (
  accessToken: string,
): Promise<Result<KompassiUserinfo, KompassiLoginError>> => {
  const url = `${getBaseUrl()}/oidc/userinfo/`;
  const headers = { authorization: `Bearer ${accessToken}` };

  try {
    const response = await fetch(url, { headers });
    const responseData = await response.json();
    const result = KompassiUserinfoSchema.safeParse(responseData);
    if (!result.success) {
      // Don't log the body here - a partially valid response would contain PII
      logger.error(
        new Error(
          `Error validating getKompassiUserinfo response: status ${response.status}`,
          { cause: result.error },
        ),
      );
      return makeErrorResult(KompassiLoginError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(result.data);
  } catch (error) {
    logger.error(
      new Error("Kompassi login: Error fetching userinfo from Kompassi", {
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
      message: "Error getting tokens from Kompassi",
      status: "error",
      errorId: "unknown",
    };
  }
  const userinfoResult = await getKompassiUserinfo(
    tokensResult.value.access_token,
  );
  if (!userinfoResult.ok) {
    return {
      message: "Error getting userinfo from Kompassi",
      status: "error",
      errorId: "unknown",
    };
  }
  const userinfo = userinfoResult.value;

  const groupNames = userinfo.groups.filter((groupName) =>
    accessGroups.has(groupName),
  );

  if (groupNames.length === 0) {
    return {
      message: "User not member of any group that would grant access",
      status: "error",
      errorId: "invalidUserGroup",
    };
  }

  const existingUserResult = await findUserByKompassiId(userinfo.sub);
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

  const derivedUsername = deriveKonstiUsername(userinfo);

  // Check if username already taken
  const findUserResult = await findUser(derivedUsername);
  if (!findUserResult.ok) {
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }
  const userWithSameUsername = findUserResult.value;

  const newUser = {
    kompassiId: userinfo.sub,
    serial,
    // Kompassi accepts addresses that Konsti's stored-email format rejects,
    // and that format is checked on read: keeping one would make the account
    // unreadable, and so impossible to log into again. The finalize form asks
    // every new Kompassi user for an address anyway.
    email: EMAIL_REGEX.test(userinfo.email) ? userinfo.email : "",
    passwordHash: "",
    userGroup: UserGroup.USER,
    groupCode: "0",
  };

  // The username is only a starting point: the user confirms or replaces it
  // before they can do anything else, so a collision just needs a suffix
  // unique to this account.
  const uniqueUsername = addKompassiIdSuffix(derivedUsername, userinfo.sub);

  let saveUserResult = await saveUser({
    ...newUser,
    username: userWithSameUsername ? uniqueUsername : derivedUsername,
  });

  // Nothing holds the name between the check above and the save, and two
  // people whose Kompassi names quote the same nick now derive the same
  // username - so the loser of that race retries with its own unique name.
  // Only on a rejected unique index: saveUser stores the row before validating
  // it, so retrying after any other error would create a second account.
  if (
    !saveUserResult.ok &&
    saveUserResult.error === MongoDbError.DUPLICATE_KEY &&
    !userWithSameUsername
  ) {
    saveUserResult = await saveUser({
      ...newUser,
      username: uniqueUsername,
    });
  }

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
    // A valid JWT for a username that no longer exists means the session is
    // stale (the account was renamed by an earlier verify or removed), so
    // tell the client to log out instead of inviting a retry
    if (userResult.error === MongoDbError.USER_NOT_FOUND) {
      return {
        message: "User of the current session not found",
        status: "error",
        errorId: "loginFailed",
      };
    }
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
