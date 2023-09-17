import { findSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { decodeJWT, getJWT, verifyJWT } from "server/utils/jwt";
import { PostLoginError, PostLoginResponse } from "shared/typings/api/login";
import { UserGroup } from "shared/typings/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const loginWithJwt = async (
  jwt: string,
): Promise<PostLoginResponse | PostLoginError> => {
  // Restore session
  const jwtData = decodeJWT(jwt);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!jwtData) {
    return {
      message: "Invalid jwt",
      status: "error",
      errorId: "unknown",
    };
  }

  if (
    jwtData.userGroup !== UserGroup.USER &&
    jwtData.userGroup !== UserGroup.ADMIN &&
    jwtData.userGroup !== UserGroup.HELP
  ) {
    return {
      message: "Invalid userGroup",
      status: "error",
      errorId: "unknown",
    };
  }

  const jwtResponse = verifyJWT(jwt, jwtData.userGroup);

  if (jwtResponse.status === "error") {
    return {
      message: "Login expired",
      status: "error",
      errorId: "unknown",
    };
  }

  if (typeof jwtResponse.username === "string") {
    const userResult = await findUser(jwtResponse.username);
    if (isErrorResult(userResult)) {
      return {
        message: "Session restore error",
        status: "error",
        errorId: "unknown",
      };
    }

    const user = unwrapResult(userResult);

    if (!user) {
      return {
        errorId: "loginFailed",
        message: "User login error",
        status: "error",
      };
    }

    const findSettingsResult = await findSettings();
    if (isErrorResult(findSettingsResult)) {
      return {
        message: "User login error",
        status: "error",
        errorId: "unknown",
      };
    }

    const settings = unwrapResult(findSettingsResult);

    if (!settings.appOpen && user.userGroup === "user") {
      return {
        errorId: "loginDisabled",
        message: "User login disabled",
        status: "error",
      };
    }

    return {
      message: "Session restore success",
      status: "success",
      username: user.username,
      userGroup: user.userGroup,
      serial: user.serial,
      groupCode: user.groupCode,
      jwt: getJWT(user.userGroup, user.username),
      eventLogItems: user.eventLogItems,
    };
  }

  return {
    message: "Restoring session failed",
    status: "error",
    errorId: "unknown",
  };
};
