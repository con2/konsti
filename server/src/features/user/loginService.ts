import { logger } from 'server/utils/logger';
import { validateLogin } from 'server/utils/bcrypt';
import { getJWT, verifyJWT, decodeJWT } from 'server/utils/jwt';
import { UserGroup } from 'server/typings/user.typings';
import { Status } from 'shared/typings/api/games';
import { findUser } from 'server/features/user/userRepository';
import { findSettings } from 'server/features/settings/settingsRepository';

interface PostLoginResponse {
  message: string;
  status: Status;
  error?: Error;
  code?: number;
  username?: string;
  userGroup?: string;
  serial?: string;
  groupCode?: string;
  jwt?: string;
}

export const login = async (
  username: string,
  password: string,
  jwt: string
): Promise<PostLoginResponse> => {
  // Restore session
  if (jwt) {
    const jwtData = decodeJWT(jwt);

    if (!jwtData) {
      return {
        message: 'Invalid jwt',
        status: 'error',
      };
    }

    const { userGroup } = jwtData;

    if (
      userGroup !== UserGroup.user &&
      userGroup !== UserGroup.admin &&
      userGroup !== UserGroup.help
    ) {
      return {
        message: 'Invalid userGroup',
        status: 'error',
      };
    }

    const jwtResponse = verifyJWT(jwt, userGroup);

    if (jwtResponse.status === 'error') {
      return {
        message: 'Invalid jwt',
        status: 'error',
      };
    }

    if (typeof jwtResponse.username === 'string') {
      let user;
      try {
        user = await findUser(jwtResponse.username);
      } catch (error) {
        logger.error(`Login: ${error}`);
        return {
          message: 'Session restore error',
          status: 'error',
          error,
        };
      }

      if (!user) {
        logger.info(`Login: User "${username}" not found`);
        return {
          code: 21,
          message: 'User login error',
          status: 'error',
        };
      }

      let settingsResponse;
      try {
        settingsResponse = await findSettings();
      } catch (error) {
        logger.error(`Login: ${error}`);
        return {
          message: 'User login error',
          status: 'error',
          error,
        };
      }

      if (!settingsResponse.appOpen && user.userGroup === 'user') {
        return {
          code: 22,
          message: 'User login disabled',
          status: 'error',
        };
      }

      return {
        message: 'Session restore success',
        status: 'success',
        username: user.username,
        userGroup: user.userGroup,
        serial: user.serial,
        groupCode: user.groupCode,
        jwt: getJWT(user.userGroup, user.username),
      };
    }
  }

  let user;
  try {
    user = await findUser(username);
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: 'User login error',
      status: 'error',
      error,
    };
  }

  if (!user) {
    logger.info(`Login: User "${username}" not found`);
    return {
      code: 21,
      message: 'User login error',
      status: 'error',
    };
  }

  let settingsResponse;
  try {
    settingsResponse = await findSettings();
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: 'User login error',
      status: 'error',
      error,
    };
  }

  if (!settingsResponse.appOpen && user.userGroup === 'user') {
    return {
      code: 22,
      message: 'User login disabled',
      status: 'error',
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
        message: 'User login success',
        status: 'success',
        username: user.username,
        userGroup: user.userGroup,
        serial: user.serial,
        groupCode: user.groupCode,
        jwt: getJWT(user.userGroup, user.username),
      };
    } else {
      logger.info(`Login: Password for user "${username}" doesn't match`);

      return {
        code: 21,
        message: 'User login error',
        status: 'error',
      };
    }
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: 'User login error',
      status: 'error',
      error,
    };
  }
};
