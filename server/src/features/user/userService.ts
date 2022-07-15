import { logger } from "server/utils/logger";
import { hashPassword } from "server/utils/bcrypt";
import { findSerial } from "server/features/serial/serialRepository";
import {
  updateUserPassword,
  findUser,
  findUserBySerial,
  findUserSerial,
  saveUser,
} from "server/features/user/userRepository";
import {
  GetUserBySerialResponse,
  GetUserResponse,
  PostUserError,
  PostUserResponse,
} from "shared/typings/api/users";
import { ApiError } from "shared/typings/api/errors";
import { findUserSignups } from "server/features/signup/signupRepository";
import { SelectedGame } from "shared/typings/models/user";

export const storeUser = async (
  username: string,
  password: string,
  serial: string | undefined
): Promise<PostUserResponse | PostUserError> => {
  if (serial === undefined) {
    return {
      message: "Invalid serial",
      status: "error",
      errorId: "invalidSerial",
    };
  }

  let serialFound = false;
  try {
    serialFound = await findSerial(serial);
  } catch (error) {
    logger.error(`Error finding serial: ${error}`);
    return {
      errorId: "unknown",
      message: "Finding serial failed",
      status: "error",
    };
  }

  // Check for valid serial
  if (!serialFound) {
    logger.info("User: Serial is not valid");
    return {
      errorId: "invalidSerial",
      message: "Invalid serial",
      status: "error",
    };
  }

  logger.info("User: Serial is valid");

  // Check that serial is not used
  let user;
  try {
    // Check if user already exists
    user = await findUser(username);
  } catch (error) {
    logger.error(`findUser(): ${error}`);
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }

  if (user) {
    logger.info(`User: Username "${username}" is already registered`);
    return {
      errorId: "usernameNotFree",
      message: "Username in already registered",
      status: "error",
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
        errorId: "unknown",
        message: "Finding serial failed",
        status: "error",
      };
    }

    // Serial used
    if (serialResponse) {
      logger.info("User: Serial used");
      return {
        errorId: "invalidSerial",
        message: "Invalid serial",
        status: "error",
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
          errorId: "unknown",
          message: "Hashing password failed",
          status: "error",
        };
      }

      if (!passwordHash) {
        logger.info("User: Serial used");
        return {
          errorId: "invalidSerial",
          message: "Invalid serial",
          status: "error",
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
            errorId: "unknown",
            message: "User registration failed",
            status: "error",
          };
        }

        return {
          message: "User registration success",
          status: "success",
          username: saveUserResponse.username,
          password: saveUserResponse.password,
        };
      }
    }
  }

  return {
    message: "Unknown error",
    status: "error",
    errorId: "unknown",
  };
};

const PASSWORD_CHANGE_NOT_ALLOWED = ["admin", "helper"];

export const storeUserPassword = async (
  username: string,
  password: string,
  requester: string
): Promise<PostUserResponse | ApiError> => {
  if (
    requester === "helper" &&
    PASSWORD_CHANGE_NOT_ALLOWED.includes(username)
  ) {
    return {
      message: "Password change not allowed",
      status: "error",
      errorId: "notAllowed",
    };
  }

  let passwordHash;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }

  try {
    await updateUserPassword(username, passwordHash);
  } catch (error) {
    logger.error(`updateUserPassword error: ${error}`);
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Password changed",
    status: "success",
    username: "notAvailable",
    password: "notAvailable",
  };
};

export const fetchUserByUsername = async (
  username: string
): Promise<GetUserResponse | ApiError> => {
  let user;
  let signups;

  if (username) {
    try {
      user = await findUser(username);
      signups = await findUserSignups(username);
    } catch (error) {
      logger.error(`findUser(): ${error}`);
      return {
        message: "Getting user data failed",
        status: "error",
        errorId: "unknown",
      };
    }
  }

  if (!user) {
    return {
      message: `User ${username} not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const enteredGames: SelectedGame[] = signups
    ? signups.flatMap((signup) => {
        const signupForUser = signup.userSignups.find(
          (userSignup) => userSignup.username === username
        );
        if (!signupForUser) return [];
        return {
          gameDetails: signup.game,
          priority: signupForUser.priority,
          time: signupForUser.time,
          message: signupForUser.message,
        };
      })
    : [];

  return {
    message: "Getting user data success",
    status: "success",
    games: {
      enteredGames,
      favoritedGames: user.favoritedGames,
      signedGames: user.signedGames,
    },
    username: user.username,
    serial: user.serial,
  };
};

export const fetchUserBySerialOrUsername = async (
  searchTerm: string
): Promise<GetUserBySerialResponse | ApiError> => {
  let user;

  try {
    user = await findUserBySerial(searchTerm);

    if (user === null) {
      user = await findUser(searchTerm);
    }
  } catch (error) {
    logger.error(`fetchUserBySerialOrUsername(): ${error}`);
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  if (!user) {
    return {
      message: `User with search term ${searchTerm} not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Getting user data success",
    status: "success",
    serial: user.serial,
    username: user.username,
  };
};
