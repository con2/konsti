import { findSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { decodeJWT, getJWT, verifyJWT } from "server/utils/jwt";
import { PostLoginError, PostLoginResponse } from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const loginWithJwt = async (
  jwt: string,
): Promise<PostLoginResponse | PostLoginError> => {
  // Restore session
  const jwtData = decodeJWT(jwt);

  if (!jwtData) {
    return {
      message: "Invalid jwt",
      status: "error",
      errorId: "unknown",
    };
  }

  if (!Object.values(UserGroup).includes(jwtData.userGroup)) {
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

  if (typeof jwtResponse.body.username === "string") {
    const userResult = await findUser(jwtResponse.body.username);
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

    if (!settings.appOpen && user.userGroup === UserGroup.USER) {
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
      groupCreatorCode: user.groupCreatorCode,
      jwt: getJWT(user.userGroup, user.username),
      eventLogItems: user.eventLogItems,
      kompassiUsernameAccepted: user.kompassiUsernameAccepted,
      kompassiId: user.kompassiId,
      email: user.email,
      emailNotificationPermitAsked: user.emailNotificationPermitAsked,
    };
  }

  return {
    message: "Restoring session failed",
    status: "error",
    errorId: "unknown",
  };
};
