import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { decodeJWT, getJWT, verifyJWT } from "server/utils/jwt";
import { PostSessionRecoveryResponse } from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
export const loginWithJwt = async (
  jwt: string,
): Promise<PostSessionRecoveryResponse> => {
  // Restore session
  const jwtData = decodeJWT(jwt);

  if (!jwtData) {
    return {
      message: "Invalid jwt",
      status: "error",
      errorId: "sessionExpired",
    };
  }

  if (!Object.values(UserGroup).includes(jwtData.userGroup)) {
    return {
      message: "Invalid userGroup",
      status: "error",
      errorId: "sessionExpired",
    };
  }

  const jwtResponse = verifyJWT(jwt, jwtData.userGroup);

  if (jwtResponse.status === "error") {
    return {
      message: "Login expired",
      status: "error",
      errorId: "sessionExpired",
    };
  }

  if (typeof jwtResponse.body.username === "string") {
    const userResult = await findUser(jwtResponse.body.username);
    if (!userResult.ok) {
      return {
        message: "Session restore error",
        status: "error",
        errorId: "unknown",
      };
    }

    const user = userResult.value;

    if (!user) {
      return {
        errorId: "loginFailed",
        message: "User login error",
        status: "error",
      };
    }

    const findSettingsResult = await findOrCreateSettings();
    if (!findSettingsResult.ok) {
      return {
        message: "User login error",
        status: "error",
        errorId: "unknown",
      };
    }

    if (
      !findSettingsResult.value.appOpen &&
      user.userGroup === UserGroup.USER
    ) {
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
      isGroupCreator: user.isGroupCreator,
      jwt: getJWT(user.userGroup, user.username),
      eventLogItems: user.eventLogItems,
      kompassiUsernameAccepted: user.kompassiUsernameAccepted,
      kompassiId: user.kompassiId,
      email: user.email,
      emailNotificationPermitAsked: user.emailNotificationPermitAsked,
    };
  }

  // Reached when the verified token carries no username, i.e. the token is
  // malformed rather than the server having a problem
  return {
    message: "Restoring session failed",
    status: "error",
    errorId: "sessionExpired",
  };
};
