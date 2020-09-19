import { logger } from 'utils/logger';
import { db } from 'db/mongodb';
import { validateLogin } from 'utils/bcrypt';
import { getJWT, verifyJWT, decodeJWT } from 'utils/jwt';
import { Request, Response } from 'express';
import { UserGroup } from 'typings/user.typings';

const postLogin = async (req: Request, res: Response): Promise<unknown> => {
  logger.info('API call: POST /api/login');
  const { username, password, jwt } = req.body;

  if (((!username || !password) && !jwt) || (username && password && jwt)) {
    return res.sendStatus(422);
  }

  // Restore session
  if (jwt) {
    const jwtData = decodeJWT(jwt);

    if (!jwtData) {
      return res.json({
        message: 'Invalid jwt',
        status: 'error',
      });
    }

    const { userGroup } = jwtData;

    if (
      userGroup !== UserGroup.user &&
      userGroup !== UserGroup.admin &&
      userGroup !== UserGroup.help
    ) {
      return res.json({
        message: 'Invalid userGroup',
        status: 'error',
      });
    }

    const jwtResponse = verifyJWT(jwt, userGroup);

    if (jwtResponse.status === 'error') {
      return res.json({
        message: 'Invalid jwt',
        status: 'error',
      });
    }

    if (typeof jwtResponse.username === 'string') {
      let user;
      try {
        user = await db.user.findUser(jwtResponse.username);
      } catch (error) {
        logger.error(`Login: ${error}`);
        return res.json({
          message: 'Session restore error',
          status: 'error',
          error,
        });
      }

      if (!user) {
        logger.info(`Login: User "${username}" not found`);
        return res.json({
          code: 21,
          message: 'User login error',
          status: 'error',
        });
      }

      let settingsResponse;
      try {
        settingsResponse = await db.settings.findSettings();
      } catch (error) {
        logger.error(`Login: ${error}`);
        return res.json({
          message: 'User login error',
          status: 'error',
          error,
        });
      }

      if (!settingsResponse.appOpen && user.userGroup === 'user') {
        return res.json({
          code: 22,
          message: 'User login disabled',
          status: 'error',
        });
      }

      return res.json({
        message: 'Session restore success',
        status: 'success',
        username: user.username,
        userGroup: user.userGroup,
        serial: user.serial,
        groupCode: user.groupCode,
        jwt: getJWT(user.userGroup, user.username),
      });
    }
  }

  let user;
  try {
    user = await db.user.findUser(username);
  } catch (error) {
    logger.error(`Login: ${error}`);
    return res.json({
      message: 'User login error',
      status: 'error',
      error,
    });
  }

  if (!user) {
    logger.info(`Login: User "${username}" not found`);
    return res.json({
      code: 21,
      message: 'User login error',
      status: 'error',
    });
  }

  let settingsResponse;
  try {
    settingsResponse = await db.settings.findSettings();
  } catch (error) {
    logger.error(`Login: ${error}`);
    return res.json({
      message: 'User login error',
      status: 'error',
      error,
    });
  }

  if (!settingsResponse.appOpen && user.userGroup === 'user') {
    return res.json({
      code: 22,
      message: 'User login disabled',
      status: 'error',
    });
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
      return res.json({
        message: 'User login success',
        status: 'success',
        username: user.username,
        userGroup: user.userGroup,
        serial: user.serial,
        groupCode: user.groupCode,
        jwt: getJWT(user.userGroup, user.username),
      });
    } else {
      logger.info(`Login: Password for user "${username}" doesn't match`);

      return res.json({
        code: 21,
        message: 'User login error',
        status: 'error',
      });
    }
  } catch (error) {
    logger.error(`Login: ${error}`);
    return res.json({
      message: 'User login error',
      status: 'error',
      error,
    });
  }
};

export { postLogin };
