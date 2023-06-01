import { validateLogin } from "server/utils/bcrypt";
import { PostLoginError, PostLoginResponse } from "shared/typings/api/login";
import { getJWT } from "server/utils/jwt";
import { findSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const login = async (
  username: string,
  password: string
): Promise<PostLoginResponse | PostLoginError> => {
  const userAsyncResult = await findUser(username);
  if (isErrorResult(userAsyncResult)) {
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = unwrapResult(userAsyncResult);

  if (!user) {
    logger.info(`Login: User "${username}" not found`);
    return {
      errorId: "loginFailed",
      message: "User login error",
      status: "error",
    };
  }

  const findSettingsAsyncResult = await findSettings();
  if (isErrorResult(findSettingsAsyncResult)) {
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }

  const settings = unwrapResult(findSettingsAsyncResult);

  if (!settings.appOpen && user.userGroup === "user") {
    return {
      errorId: "loginDisabled",
      message: "User login disabled",
      status: "error",
    };
  }

  // User exists
  let validLogin;
  try {
    validLogin = await validateLogin(password, user.password);

    logger.info(
      `Login: User "${user.username}" with "${user.userGroup}" user group`
    );

    if (validLogin) {
      logger.info(`Login: Password for user "${username}" matches`);
      return {
        message: "User login success",
        status: "success",
        username: user.username,
        userGroup: user.userGroup,
        serial: user.serial,
        groupCode: user.groupCode,
        jwt: getJWT(user.userGroup, user.username),
      };
    } else {
      logger.info(`Login: Password for user "${username}" doesn't match`);

      return {
        errorId: "loginFailed",
        message: "User login error",
        status: "error",
      };
    }
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }
};
