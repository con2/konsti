import { PostLoginResponse } from "shared/types/api/login";
import { UserGroup } from "shared/types/models/user";
import { findOrCreateSettings } from "server/features/settings/settingsRepository";
import { findUser } from "server/features/user/userRepository";
import { validateLogin } from "server/utils/bcrypt";
import { getJWT } from "server/utils/jwt";
import { logger } from "server/utils/logger";

export const login = async (
  username: string,
  password: string,
): Promise<PostLoginResponse> => {
  const userResult = await findUser(username);
  if (!userResult.ok) {
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = userResult.value;

  if (!user) {
    logger.info(`Login: User ${username} not found`);
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

  if (!findSettingsResult.value.appOpen && user.userGroup === UserGroup.USER) {
    return {
      errorId: "loginDisabled",
      message: "User login disabled",
      status: "error",
    };
  }

  // User exists

  const validLoginResult = await validateLogin(password, user.password);
  if (!validLoginResult.ok) {
    return {
      errorId: "loginFailed",
      message: "User login error",
      status: "error",
    };
  }

  logger.info(`Login: User ${user.username} with ${user.userGroup} user group`);

  if (validLoginResult.value) {
    logger.info(`Login: Password for user ${username} matches`);
    return {
      message: "User login success",
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
