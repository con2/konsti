import { logger } from 'server/utils/logger';
import { db } from 'server/db/mongodb';
import { hashPassword } from 'server/utils/bcrypt';
import { Status } from 'shared/typings/api/games';
import {
  EnteredGame,
  FavoritedGame,
  SignedGame,
} from 'server/typings/user.typings';

interface PostUserResponse {
  message: string;
  status: Status;
  code?: number;
  username?: string;
  password?: string;
}

interface GetUserResponse {
  message: string;
  status: Status;
  error?: Error;
  games?: {
    enteredGames: readonly EnteredGame[];
    favoritedGames: readonly FavoritedGame[];
    signedGames: readonly SignedGame[];
  };
  username?: string;
  serial?: string;
}

export const postUser = async (
  username: string,
  password: string,
  serial: string,
  changePassword: boolean
): Promise<PostUserResponse> => {
  logger.info('API call: POST /api/user');

  if (changePassword) {
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      logger.error(`db.user.updateUser error: ${error}`);
      return {
        message: 'Password change error',
        status: 'error',
      };
    }

    try {
      await db.user.updateUserPassword(username, passwordHash);
    } catch (error) {
      logger.error(`db.user.updateUserPassword error: ${error}`);
      return {
        message: 'Password change error',
        status: 'error',
      };
    }

    return {
      message: 'Password changed',
      status: 'success',
    };
  }

  let serialFound = false;
  try {
    serialFound = await db.serial.findSerial(serial);
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
    user = await db.user.findUser(username);
  } catch (error) {
    logger.error(`db.user.findUser(): ${error}`);
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
      serialResponse = await db.user.findSerial({ serial });
    } catch (error) {
      logger.error(`db.user.findSerial(): ${error}`);
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
          saveUserResponse = await db.user.saveUser({
            username,
            passwordHash,
            serial,
          });
        } catch (error) {
          logger.error(`db.user.saveUser(): ${error}`);
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
  };
};

// Get user info
export const getUser = async (
  username: string | undefined,
  serial: string | undefined
): Promise<GetUserResponse> => {
  logger.info('API call: GET /api/user');

  let user;

  if (username) {
    try {
      user = await db.user.findUser(username);
    } catch (error) {
      logger.error(`db.user.findUser(): ${error}`);
      return {
        message: 'Getting user data failed',
        status: 'error',
        error,
      };
    }
  } else if (serial) {
    try {
      user = await db.user.findUserBySerial(serial);
    } catch (error) {
      logger.error(`db.user.findUser(): ${error}`);
      return {
        message: 'Getting user data failed',
        status: 'error',
        error,
      };
    }
  }

  if (!user) {
    return {
      message: `User ${username} not found`,
      status: 'error',
    };
  }

  return {
    message: 'Getting user data success',
    status: 'success',
    games: {
      enteredGames: user.enteredGames,
      favoritedGames: user.favoritedGames,
      signedGames: user.signedGames,
    },
    username: user.username,
    serial: user.serial,
  };
};
