import { logger } from "server/utils/logger";
import { hashPassword, validateLogin } from "server/utils/bcrypt";
import { findSerial } from "server/features/serial/serialRepository";
import {
  updateUserPassword,
  findUser,
  findUserBySerial,
  findUserSerial,
  saveUser,
  saveFavorite,
  findGroupMembers,
  saveGroupCode,
  findGroup,
  saveSignup,
} from "server/features/user/userRepository";
import {
  GetUserBySerialResponse,
  GetUserResponse,
  PostUserResponse,
} from "shared/typings/api/users";
import { ServerError } from "shared/typings/api/errors";
import { GetGroupReturnValue } from "server/typings/user.typings";
import {
  PostFavoriteResponse,
  SaveFavoriteRequest,
} from "shared/typings/api/favorite";
import { GetGroupResponse, PostGroupResponse } from "shared/typings/api/groups";
import { PostLoginResponse } from "shared/typings/api/login";
import { getJWT } from "server/utils/jwt";
import { findSettings } from "server/features/settings/settingsRepository";
import { SelectedGame, User } from "shared/typings/models/user";
import { PostSignupResponse } from "shared/typings/api/signup";
import { UserSignup } from "server/typings/result.typings";
import { isValidSignupTime } from "server/features/user/userUtils";

export const storeUser = async (
  username: string,
  password: string,
  serial: string | undefined
): Promise<PostUserResponse | ServerError> => {
  if (serial === undefined) {
    return {
      message: "Invalid serial",
      status: "error",
      code: 12,
    };
  }

  let serialFound = false;
  try {
    serialFound = await findSerial(serial);
  } catch (error) {
    logger.error(`Error finding serial: ${error}`);
    return {
      code: 10,
      message: "Finding serial failed",
      status: "error",
    };
  }

  // Check for valid serial
  if (!serialFound) {
    logger.info("User: Serial is not valid");
    return {
      code: 12,
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
      code: 10,
      message: "Finding user failed",
      status: "error",
    };
  }

  if (user) {
    logger.info(`User: Username "${username}" is already registered`);
    return {
      code: 11,
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
        code: 10,
        message: "Finding serial failed",
        status: "error",
      };
    }

    // Serial used
    if (serialResponse) {
      logger.info("User: Serial used");
      return {
        code: 12,
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
          code: 10,
          message: "Hashing password failed",
          status: "error",
        };
      }

      if (!passwordHash) {
        logger.info("User: Serial used");
        return {
          code: 12,
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
            code: 10,
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
    code: 0,
  };
};

export const storeUserPassword = async (
  username: string,
  password: string
): Promise<PostUserResponse | ServerError> => {
  let passwordHash;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    logger.error(`updateUser error: ${error}`);
    return {
      message: "Password change error",
      status: "error",
      code: 0,
    };
  }

  try {
    await updateUserPassword(username, passwordHash);
  } catch (error) {
    logger.error(`updateUserPassword error: ${error}`);
    return {
      message: "Password change error",
      status: "error",
      code: 0,
    };
  }

  return {
    message: "Password changed",
    status: "success",
    username: "notAvailable",
    password: "notAvailable",
  };

  return {
    message: "Unknown error",
    status: "error",
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
        message: "Getting user data failed",
        status: "error",
        code: 0,
      };
    }
  }

  if (!user) {
    return {
      message: `User ${username} not found`,
      status: "error",
      code: 0,
    };
  }

  return {
    message: "Getting user data success",
    status: "success",
    games: {
      enteredGames: user.enteredGames,
      favoritedGames: user.favoritedGames,
      signedGames: user.signedGames,
    },
    username: user.username,
    serial: user.serial,
  };
};

export const fetchUserBySerialOrUsername = async (
  searchTerm: string
): Promise<GetUserBySerialResponse | ServerError> => {
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
      code: 0,
    };
  }

  if (!user) {
    return {
      message: `User with search term ${searchTerm} not found`,
      status: "error",
      code: 0,
    };
  }

  return {
    message: "Getting user data success",
    status: "success",
    serial: user.serial,
    username: user.username,
  };
};

export const storeFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse | ServerError> => {
  let favoritedGames;
  try {
    favoritedGames = await saveFavorite(favoriteData);
  } catch (error) {
    return {
      message: "Update favorite failure",
      status: "error",
      code: 0,
    };
  }

  if (favoritedGames) {
    return {
      message: "Update favorite success",
      status: "success",
      favoritedGames,
    };
  }

  return {
    message: "Update favorite failure",
    status: "error",
    code: 0,
  };
};

export const storeGroup = async (
  username: string,
  isGroupLeader: boolean,
  groupCode: string,
  ownSerial: string,
  leaveGroup = false,
  closeGroup = false
): Promise<PostGroupResponse | ServerError> => {
  if (closeGroup) {
    const groupMembers = await findGroupMembers(groupCode);

    try {
      await Promise.all(
        groupMembers.map(async (groupMember) => {
          await saveGroupCode("0", groupMember.username);
        })
      );
    } catch (error) {
      logger.error(`findGroupMembers: ${error}`);
      throw new Error("Error closing group");
    }

    return {
      message: "Group closed successfully",
      status: "success",
      groupCode: "0",
    };
  }

  if (leaveGroup) {
    const groupMembers = await findGroupMembers(groupCode);

    if (isGroupLeader && groupMembers.length > 1) {
      return {
        message: "Leader cannot leave non-empty group",
        status: "error",
        code: 36,
      };
    }

    let saveGroupResponse;
    try {
      saveGroupResponse = await saveGroupCode("0", username);
    } catch (error) {
      logger.error(`Failed to leave group: ${error}`);
      return {
        message: "Failed to leave group",
        status: "error",
        code: 35,
      };
    }

    if (saveGroupResponse) {
      return {
        message: "Leave group success",
        status: "success",
        groupCode: saveGroupResponse.groupCode,
      };
    } else {
      logger.error("Failed to leave group");
      return {
        message: "Failed to leave group",
        status: "error",
        code: 35,
      };
    }
  }

  // Create group
  if (isGroupLeader) {
    // Check that serial is not used
    let findGroupResponse;
    try {
      // Check if group exists
      findGroupResponse = await findGroup(groupCode, username);
    } catch (error) {
      logger.error(`findUser(): ${error}`);
      return {
        message: "Own group already exists",
        status: "error",
        code: 34,
      };
    }

    if (findGroupResponse) {
      // Group exists
      return {
        message: "Own group already exists",
        status: "error",
        code: 34,
      };
    }

    // No existing group, create
    let saveGroupResponse;
    try {
      saveGroupResponse = await saveGroupCode(groupCode, username);
    } catch (error) {
      logger.error(`saveGroup(): ${error}`);
      return {
        message: "Save group failure",
        status: "error",
        code: 30,
      };
    }

    if (saveGroupResponse) {
      return {
        message: "Create group success",
        status: "success",
        groupCode: saveGroupResponse.groupCode,
      };
    } else {
      return {
        message: "Save group failure",
        status: "error",
        code: 30,
      };
    }
  }

  // Join group
  if (!isGroupLeader) {
    // Cannot join own group
    if (ownSerial === groupCode) {
      return {
        message: "Cannot join own group",
        status: "error",
        code: 33,
      };
    }

    // Check if code is valid
    let findSerialResponse;
    try {
      findSerialResponse = await findUserSerial({ serial: groupCode });
    } catch (error) {
      logger.error(`findSerial(): ${error}`);
      return {
        message: "Error finding serial",
        status: "error",
        code: 31,
      };
    }

    // Code is valid
    if (!findSerialResponse) {
      return {
        message: "Invalid group code",
        status: "error",
        code: 31,
      };
    }

    // Check if group leader has created a group
    let findGroupResponse;
    try {
      const leaderUsername = findSerialResponse.username;
      findGroupResponse = await findGroup(groupCode, leaderUsername);
    } catch (error) {
      logger.error(`findGroup(): ${error}`);
      return {
        message: "Error finding group",
        status: "error",
        code: 32,
      };
    }

    // No existing group, cannot join
    if (!findGroupResponse) {
      return {
        message: "Group does not exist",
        status: "error",
        code: 32,
      };
    }

    // Group exists, join
    let saveGroupResponse;
    try {
      saveGroupResponse = await saveGroupCode(groupCode, username);
    } catch (error) {
      logger.error(`saveGroup(): ${error}`);
      return {
        message: "Error saving group",
        status: "error",
        code: 30,
      };
    }

    if (saveGroupResponse) {
      return {
        message: "Joined to group success",
        status: "success",
        groupCode: saveGroupResponse.groupCode,
      };
    } else {
      logger.error("Failed to sign to group");
      return {
        message: "Failed to update group",
        status: "error",
        code: 30,
      };
    }
  }

  return {
    message: "Unknown error",
    status: "error",
    code: 0,
  };
};

export const fetchGroup = async (
  groupCode: string
): Promise<GetGroupResponse | ServerError> => {
  let findGroupResults: User[];
  try {
    findGroupResults = await findGroupMembers(groupCode);

    const returnData: GetGroupReturnValue[] = [];
    for (const findGroupResult of findGroupResults) {
      returnData.push({
        groupCode: findGroupResult.groupCode,
        signedGames: findGroupResult.signedGames,
        enteredGames: findGroupResult.enteredGames,
        serial: findGroupResult.serial,
        username: findGroupResult.username,
      });
    }

    return {
      message: "Getting group members success",
      status: "success",
      results: returnData,
    };
  } catch (error) {
    logger.error(`Results: ${error}`);
    return {
      message: "Getting group members failed",
      status: "error",
      code: 0,
    };
  }
};

export const login = async (
  username: string,
  password: string
): Promise<PostLoginResponse | ServerError> => {
  let user;
  try {
    user = await findUser(username);
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: "User login error",
      status: "error",
      code: 0,
    };
  }

  if (!user) {
    logger.info(`Login: User "${username}" not found`);
    return {
      code: 21,
      message: "User login error",
      status: "error",
    };
  }

  let settingsResponse;
  try {
    settingsResponse = await findSettings();
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: "User login error",
      status: "error",
      code: 0,
    };
  }

  if (!settingsResponse.appOpen && user.userGroup === "user") {
    return {
      code: 22,
      message: "User login disabled",
      status: "error",
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
        message: "User login success",
        status: "success",
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
        message: "User login error",
        status: "error",
      };
    }
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: "User login error",
      status: "error",
      code: 0,
    };
  }
};

export const storeSignup = async (
  selectedGames: readonly SelectedGame[],
  username: string,
  signupTime: string
): Promise<PostSignupResponse | ServerError> => {
  if (!signupTime) {
    return {
      message: "Signup failure",
      status: "error",
      code: 0,
    };
  }

  const validSignupTime = isValidSignupTime(signupTime);
  if (!validSignupTime) {
    return {
      code: 41,
      message: "Signup failure",
      status: "error",
    };
  }

  const modifiedSignupData: UserSignup = {
    signedGames: selectedGames,
    username,
  };

  try {
    const response = await saveSignup(modifiedSignupData);
    return {
      message: "Signup success",
      status: "success",
      signedGames: response.signedGames,
    };
  } catch (error) {
    return {
      message: "Signup failure",
      status: "error",
      code: 0,
    };
  }
};
