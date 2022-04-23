import { findSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { decodeJWT, getJWT, verifyJWT } from "server/utils/jwt";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/typings/api/errors";
import { PostLoginResponse } from "shared/typings/api/login";
import { UserGroup } from "shared/typings/models/user";

export const loginWithJwt = async (
  jwt: string
): Promise<PostLoginResponse | ApiError> => {
  // Restore session
  const jwtData = decodeJWT(jwt);

  if (!jwtData) {
    return {
      message: "Invalid jwt",
      status: "error",
      code: 0,
    };
  }

  const { userGroup, username } = jwtData;

  if (
    userGroup !== UserGroup.USER &&
    userGroup !== UserGroup.ADMIN &&
    userGroup !== UserGroup.HELP
  ) {
    return {
      message: "Invalid userGroup",
      status: "error",
      code: 0,
    };
  }

  const jwtResponse = verifyJWT(jwt, userGroup, username);

  if (jwtResponse.status === "error") {
    return {
      message: "Login expired",
      status: "error",
      code: 0,
    };
  }

  if (typeof jwtResponse.username === "string") {
    let user;
    try {
      user = await findUser(jwtResponse.username);
    } catch (error) {
      logger.error(`Login: ${error}`);
      return {
        message: "Session restore error",
        status: "error",
        code: 0,
      };
    }

    if (!user) {
      logger.info(`Login: User "${username}" not found`);
      return {
        code: 21,
        message: "User login error",
        status: "error",
      };
    }

    let settingsResponse;
    try {
      settingsResponse = await findSettings();
    } catch (error) {
      logger.error(`Login: ${error}`);
      return {
        message: "User login error",
        status: "error",
        code: 0,
      };
    }

    if (!settingsResponse.appOpen && user.userGroup === "user") {
      return {
        code: 22,
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
    };
  }

  return {
    message: "Restoring session failed",
    status: "error",
    code: 0,
  };
};
