import { validateLogin } from "server/utils/bcrypt";
import { PostLoginError, PostLoginResponse } from "shared/types/api/login";
import { getJWT } from "server/utils/jwt";
import { findSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { UserGroup } from "shared/types/models/user";

export const login = async (
  username: string,
  password: string,
): Promise<PostLoginResponse | PostLoginError> => {
  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = unwrapResult(userResult);

  if (!user) {
    logger.info(`Login: User ${username} not found`);
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

  // User exists

  const validLoginResult = await validateLogin(password, user.password);
  if (isErrorResult(validLoginResult)) {
    return {
      errorId: "loginFailed",
      message: "User login error",
      status: "error",
    };
  }

  const validLogin = unwrapResult(validLoginResult);

  logger.info(`Login: User ${user.username} with ${user.userGroup} user group`);

  if (validLogin) {
    logger.info(`Login: Password for user ${username} matches`);
    return {
      message: "User login success",
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
      email: user.email || "",
      emailNotificationPermitAsked: user.emailNotificationPermitAsked,
    };
  }

  logger.info(`Login: Password for user ${username} doesn't match`);
  return {
    errorId: "loginFailed",
    message: "User login error",
    status: "error",
  };
};
