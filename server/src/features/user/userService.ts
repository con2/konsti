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
  PostUpdateUserPasswordResponse,
  PostUserError,
  PostUserResponse,
} from "shared/types/api/users";
import { ApiError } from "shared/types/api/errors";
import { findUserDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { Signup } from "shared/types/models/user";
import { isErrorResult, unwrapResult } from "shared/utils/result";
import { config } from "shared/config";
import { createSerial } from "server/features/user/userUtils";

export const storeUser = async (
  username: string,
  password: string,
  maybeSerial: string | undefined,
): Promise<PostUserResponse | PostUserError> => {
  let serial;
  if (!config.shared().requireRegistrationCode) {
    const serialDocResult = await createSerial();
    if (isErrorResult(serialDocResult)) {
      return {
        message: "Error creating serial for new user",
        status: "error",
        errorId: "unknown",
      };
    }
    const serialDoc = unwrapResult(serialDocResult);
    serial = serialDoc[0].serial;
  } else {
    serial = maybeSerial;
  }

  if (serial === undefined) {
    return {
      message: "Invalid serial",
      status: "error",
      errorId: "invalidSerial",
    };
  }

  const serialFoundResult = await findSerial(serial);
  if (isErrorResult(serialFoundResult)) {
    return {
      errorId: "unknown",
      message: "Finding serial failed",
      status: "error",
    };
  }

  const serialFound = unwrapResult(serialFoundResult);

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

  // Check if user already exists
  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }

  const user = unwrapResult(userResult);

  if (user) {
    logger.info(`User: Username ${username} is already registered`);
    return {
      errorId: "usernameNotFree",
      message: "Username in already registered",
      status: "error",
    };
  }

  // Username free
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!user) {
    // Check if serial is used
    const serialResponseResult = await findUserSerial({ serial });
    if (isErrorResult(serialResponseResult)) {
      return {
        errorId: "unknown",
        message: "Finding serial failed",
        status: "error",
      };
    }

    const serialResponse = unwrapResult(serialResponseResult);

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!serialResponse) {
      const passwordHashResult = await hashPassword(password);
      if (isErrorResult(passwordHashResult)) {
        return {
          errorId: "unknown",
          message: "Hashing password failed",
          status: "error",
        };
      }

      const passwordHash = unwrapResult(passwordHashResult);

      if (!passwordHash) {
        logger.info("User: Serial used");
        return {
          errorId: "invalidSerial",
          message: "Invalid serial",
          status: "error",
        };
      }

      if (passwordHash) {
        const saveUserResponseResult = await saveUser({
          kompassiId: 0,
          username,
          passwordHash,
          serial,
        });
        if (isErrorResult(saveUserResponseResult)) {
          return {
            errorId: "unknown",
            message: "User registration failed",
            status: "error",
          };
        }

        const saveUserResponse = unwrapResult(saveUserResponseResult);

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
  requester: string,
): Promise<PostUpdateUserPasswordResponse | ApiError> => {
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

  const passwordHashResult = await hashPassword(password);
  if (isErrorResult(passwordHashResult)) {
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }

  const passwordHash = unwrapResult(passwordHashResult);

  const updateUserPasswordResult = await updateUserPassword(
    username,
    passwordHash,
  );

  if (isErrorResult(updateUserPasswordResult)) {
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }
  const user = unwrapResult(updateUserPasswordResult);

  return {
    message: "Password changed",
    status: "success",
    username: user.username,
  };
};

export const fetchUserByUsername = async (
  username: string,
): Promise<GetUserResponse | ApiError> => {
  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = unwrapResult(userResult);
  if (!user) {
    return {
      message: `User ${username} not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const signupsResult = await findUserDirectSignups(username);
  if (isErrorResult(signupsResult)) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsResult);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const directSignups: Signup[] = signups
    ? signups.flatMap((signup) => {
        const signupForUser = signup.userSignups.find(
          (userSignup) => userSignup.username === username,
        );
        if (!signupForUser) {
          return [];
        }
        return {
          programItemDetails: signup.programItem,
          priority: signupForUser.priority,
          time: signupForUser.time,
          message: signupForUser.message,
        };
      })
    : [];

  return {
    message: "Getting user data success",
    status: "success",
    programItems: {
      directSignups,
      favoritedProgramItems: user.favoritedProgramItems,
      lotterySignups: user.lotterySignups,
    },
    username: user.username,
    serial: user.serial,
    groupCode: user.groupCode,
    groupCreatorCode: user.groupCreatorCode,
    eventLogItems: user.eventLogItems,
  };
};

export const fetchUserBySerialOrUsername = async (
  searchTerm: string,
): Promise<GetUserBySerialResponse | ApiError> => {
  // Try to find user first with serial
  const userBySerialResult = await findUserBySerial(searchTerm);
  if (isErrorResult(userBySerialResult)) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const userBySerial = unwrapResult(userBySerialResult);

  if (userBySerial) {
    return {
      message: "Getting user data success",
      status: "success",
      serial: userBySerial.serial,
      username: userBySerial.username,
      createdAt: userBySerial.createdAt,
    };
  }

  // If serial find fails, use username
  const userResult = await findUser(searchTerm);
  if (isErrorResult(userResult)) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = unwrapResult(userResult);

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
    createdAt: user.createdAt,
  };
};
