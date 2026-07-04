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
import { DirectSignup, UserGroup } from "shared/types/models/user";

export const storeUser = async (
  username: string,
  password: string,
  serial: string,
): Promise<PostUserResponse> => {
  const serialFoundResult = await findSerial(serial);
  if (!serialFoundResult.ok) {
    return {
      errorId: "unknown",
      message: "Finding serial failed",
      status: "error",
    };
  }

  // Check for valid serial
  if (!serialFoundResult.value) {
    logger.info(`User ${username}: Serial is not valid`);
    return {
      errorId: "invalidSerial",
      message: "Invalid serial",
      status: "error",
    };
  }

  logger.info(`User ${username}: Serial is valid`);

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
    logger.info(`User ${username}: Username is already registered`);
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
      logger.info(`User ${username}: Serial used`);
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
        logger.error(new Error(`User ${username}: Password hashing failed`));
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

        return {
          message: "User registration success",
          status: "success",
          username: saveUserResponseResult.value.username,
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
  requesterUserGroup: UserGroup | null,
): Promise<PostUpdateUserPasswordResponse> => {
  // Helpers may reset regular users but not the admin/helper accounts; admins may reset anyone
  if (
    requesterUserGroup === UserGroup.HELPER &&
    PASSWORD_CHANGE_NOT_ALLOWED.has(username)
  ) {
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

  const updateUserPasswordResult = await updateUserPassword(
    username,
    passwordHashResult.value,
  );

  if (!updateUserPasswordResult.ok) {
    return {
      message: "Password change error",
      status: "error",
      errorId: "unknown",
    };
  }
  return {
    message: "Password changed",
    status: "success",
    username: updateUserPasswordResult.value.username,
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

  const directSignups: DirectSignup[] = signupsResult.value.flatMap(
    (signup) => {
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
    },
  );

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
    isGroupCreator: user.isGroupCreator,
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
