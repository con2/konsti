import { logger } from 'server/utils/logger';
import { hashPassword } from 'server/utils/bcrypt';
import { findSerial } from 'server/features/serial/serialRepository';
import {
  updateUserPassword,
  findUser,
  findUserBySerial,
  findUserSerial,
  saveUser,
} from 'server/features/user/userRepository';
import {
  GetUserBySerialResponse,
  GetUserResponse,
  PostUserResponse,
} from 'shared/typings/api/users';
import { ServerError } from 'shared/typings/api/errors';
import { Game } from 'shared/typings/models/game';

export const storeUser = async (
  username: string,
  password: string,
  serial: string,
  changePassword: boolean
): Promise<PostUserResponse | ServerError> => {
  if (changePassword) {
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      logger.error(`updateUser error: ${error}`);
      return {
        message: 'Password change error',
        status: 'error',
        code: 0,
      };
    }

    try {
      await updateUserPassword(username, passwordHash);
    } catch (error) {
      logger.error(`updateUserPassword error: ${error}`);
      return {
        message: 'Password change error',
        status: 'error',
        code: 0,
      };
    }

    return {
      message: 'Password changed',
      status: 'success',
      username: 'notAvailable',
      password: 'notAvailable',
    };
  }

  let serialFound = false;
  try {
    serialFound = await findSerial(serial);
  } catch (error) {
    logger.error(`Error finding serial: ${error}`);
    return {
      code: 10,
      message: 'Finding serial failed',
      status: 'error',
    };
  }

  // Check for valid serial
  if (!serialFound) {
    logger.info('User: Serial is not valid');
    return {
      code: 12,
      message: 'Invalid serial',
      status: 'error',
    };
  }

  logger.info('User: Serial is valid');

  // Check that serial is not used
  let user;
  try {
    // Check if user already exists
    user = await findUser(username);
  } catch (error) {
    logger.error(`findUser(): ${error}`);
    return {
      code: 10,
      message: 'Finding user failed',
      status: 'error',
    };
  }

  if (user) {
    logger.info(`User: Username "${username}" is already registered`);
    return {
      code: 11,
      message: 'Username in already registered',
      status: 'error',
    };
  }

  // Username free
  if (!user) {
    // Check if serial is used
    let serialResponse;
    try {
      serialResponse = await findUserSerial({ serial });
    } catch (error) {
      logger.error(`findSerial(): ${error}`);
      return {
        code: 10,
        message: 'Finding serial failed',
        status: 'error',
      };
    }

    // Serial used
    if (serialResponse) {
      logger.info('User: Serial used');
      return {
        code: 12,
        message: 'Invalid serial',
        status: 'error',
      };
    }

    // Serial not used
    if (!serialResponse) {
      let passwordHash;
      try {
        passwordHash = await hashPassword(password);
      } catch (error) {
        logger.error(`hashPassword(): ${error}`);
        return {
          code: 10,
          message: 'Hashing password failed',
          status: 'error',
        };
      }

      if (!passwordHash) {
        logger.info('User: Serial used');
        return {
          code: 12,
          message: 'Invalid serial',
          status: 'error',
        };
      }

      if (passwordHash) {
        let saveUserResponse;
        try {
          saveUserResponse = await saveUser({
            username,
            passwordHash,
            serial,
          });
        } catch (error) {
          logger.error(`saveUser(): ${error}`);
          return {
            code: 10,
            message: 'User registration failed',
            status: 'error',
          };
        }

        return {
          message: 'User registration success',
          status: 'success',
          username: saveUserResponse.username,
          password: saveUserResponse.password,
        };
      }
    }
  }

  return {
    message: 'Unknown error',
    status: 'error',
    code: 0,
  };
};

export const fetchUserByUsername = async (
  username: string
): Promise<GetUserResponse | ServerError> => {
  let user;

  if (username) {
    try {
      user = await findUser(username);
    } catch (error) {
      logger.error(`findUser(): ${error}`);
      return {
        message: 'Getting user data failed',
        status: 'error',
        code: 0,
      };
    }
  }

  if (!user) {
    return {
      message: `User ${username} not found`,
      status: 'error',
      code: 0,
    };
  }

  return {
    message: 'Getting user data success',
    status: 'success',
    games: {
      enteredGames: user.enteredGames,
      favoritedGames: user.favoritedGames as readonly Game[],
      signedGames: user.signedGames,
    },
    username: user.username,
    serial: user.serial,
  };
};

export const fetchUserBySerial = async (
  serial: string
): Promise<GetUserBySerialResponse | ServerError> => {
  let user;

  if (serial) {
    try {
      user = await findUserBySerial(serial);
    } catch (error) {
      logger.error(`fetchUserBySerial(): ${error}`);
      return {
        message: 'Getting user data failed',
        status: 'error',
        code: 0,
      };
    }
  }

  if (!user) {
    return {
      message: `User with serial ${serial} not found`,
      status: 'error',
      code: 0,
    };
  }

  return {
    message: 'Getting user data success',
    status: 'success',
    games: {
      enteredGames: user.enteredGames,
      favoritedGames: user.favoritedGames as Game[],
      signedGames: user.signedGames,
    },
    username: user.username,
    serial: user.serial,
  };
};
