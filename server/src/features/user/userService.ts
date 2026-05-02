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
  PostUserResponse,
} from "shared/types/api/users";
import { findUserDirectSignups } from "server/features/direct-signup/directSignupRepository";
import { DirectSignup } from "shared/types/models/user";
import { config } from "shared/config";
import { createSerial } from "server/features/user/userUtils";

export const storeUser = async (
  username: string,
  password: string,
  maybeSerial: string | undefined,
): Promise<PostUserResponse> => {
  let serial;
  if (config.event().requireRegistrationCode) {
    serial = maybeSerial;
  } else {
    const serialDocResult = await createSerial();
    if (!serialDocResult.ok) {
      return {
        message: "Error creating serial for new user",
        status: "error",
        errorId: "unknown",
      };
    }
    const serialDoc = serialDocResult.value;
    serial = serialDoc[0].serial;
  }

  if (serial === undefined) {
    return {
      message: "Invalid serial",
      status: "error",
      errorId: "invalidSerial",
    };
  }

  const serialFoundResult = await findSerial(serial);
  if (!serialFoundResult.ok) {
    return {
      errorId: "unknown",
      message: "Finding serial failed",
      status: "error",
    };
  }

  const serialFound = serialFoundResult.value;

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
  if (!userResult.ok) {
    return {
      errorId: "unknown",
      message: "Finding user failed",
      status: "error",
    };
  }

  const user = userResult.value;

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
    if (!serialResponseResult.ok) {
      return {
        errorId: "unknown",
        message: "Finding serial failed",
        status: "error",
      };
    }

    const serialResponse = serialResponseResult.value;

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
      if (!passwordHashResult.ok) {
        return {
          errorId: "unknown",
          message: "Hashing password failed",
          status: "error",
        };
      }

      const passwordHash = passwordHashResult.value;

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
        if (!saveUserResponseResult.ok) {
          return {
            errorId: "unknown",
            message: "User registration failed",
            status: "error",
          };
        }

        const saveUserResponse = saveUserResponseResult.value;

        return {
          message: "User registration success",
          status: "success",
          username: saveUserResponse.username,
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

const PASSWORD_CHANGE_NOT_ALLOWED = new Set(["admin", "helper"]);

export const storeUserPassword = async (
  username: string,
  password: string,
  requester: string,
): Promise<PostUpdateUserPasswordResponse> => {
  if (requester === "helper" && PASSWORD_CHANGE_NOT_ALLOWED.has(username)) {
    return {
      message: "Password change not allowed",
      status: "error",
      errorId: "notAllowed",
    };
  }

  const passwordHashResult = await hashPassword(password);
  if (!passwordHashResult.ok) {
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }

  const passwordHash = passwordHashResult.value;

  const updateUserPasswordResult = await updateUserPassword(
    username,
    passwordHash,
  );

  if (!updateUserPasswordResult.ok) {
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }
  const user = updateUserPasswordResult.value;

  return {
    message: "Password changed",
    status: "success",
    username: user.username,
  };
};

export const fetchUserByUsername = async (
  username: string,
): Promise<GetUserResponse> => {
  const userResult = await findUser(username);
  if (!userResult.ok) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = userResult.value;
  if (!user) {
    return {
      message: `User ${username} not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  const signupsResult = await findUserDirectSignups(username);
  if (!signupsResult.ok) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = signupsResult.value;

  const directSignups: DirectSignup[] = signups.flatMap((signup) => {
    const signupForUser = signup.userSignups.find(
      (userSignup) => userSignup.username === username,
    );
    if (!signupForUser) {
      return [];
    }
    return {
      programItemId: signup.programItemId,
      priority: signupForUser.priority,
      signedToStartTime: signupForUser.signedToStartTime,
      message: signupForUser.message,
    };
  });

  return {
    message: "Getting user data success",
    status: "success",
    programItems: {
      directSignups,
      favoriteProgramItemIds: user.favoriteProgramItemIds,
      lotterySignups: user.lotterySignups,
    },
    username: user.username,
    serial: user.serial,
    groupCode: user.groupCode,
    groupCreatorCode: user.groupCreatorCode,
    eventLogItems: user.eventLogItems,
    email: user.email || "",
  };
};

export const fetchUserBySerialOrUsername = async (
  searchTerm: string,
): Promise<GetUserBySerialResponse> => {
  // Try to find user first with serial
  const userBySerialResult = await findUserBySerial(
    searchTerm.replaceAll("-", ""),
  );
  if (!userBySerialResult.ok) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const userBySerial = userBySerialResult.value;

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
  if (!userResult.ok) {
    return {
      message: "Getting user data failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const user = userResult.value;

  if (!user) {
    return {
      message: `User with search term ${searchTerm} not found`,
      status: "error",
      errorId: "unknown",
    };
  }

  if (user.kompassiId) {
    return {
      message: "User logged in with Kompassi account",
      status: "error",
      errorId: "kompassiLogin",
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
