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
  saveSignedGames,
} from "server/features/user/userRepository";
import {
  GetUserBySerialResponse,
  GetUserResponse,
  PostUserError,
  PostUserResponse,
} from "shared/typings/api/users";
import { ApiError } from "shared/typings/api/errors";
import { GetGroupReturnValue } from "server/typings/user.typings";
import {
  PostFavoriteResponse,
  SaveFavoriteRequest,
} from "shared/typings/api/favorite";
import {
  GetGroupResponse,
  PostGroupError,
  PostGroupResponse,
} from "shared/typings/api/groups";
import { PostLoginError, PostLoginResponse } from "shared/typings/api/login";
import { getJWT } from "server/utils/jwt";
import { findSettings } from "server/features/settings/settingsRepository";
import { SelectedGame, User } from "shared/typings/models/user";
import {
  PostSignedGamesError,
  PostSignedGamesResponse,
} from "shared/typings/api/myGames";
import { UserSignup } from "server/typings/result.typings";
import { isValidSignupTime } from "server/features/user/userUtils";

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

export const storeUserPassword = async (
  username: string,
  password: string
): Promise<PostUserResponse | ApiError> => {
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

  return {
    message: "Unknown error",
    status: "error",
    errorId: "unknown",
  };
};

export const fetchUserByUsername = async (
  username: string
): Promise<GetUserResponse | ApiError> => {
  let user;

  if (username) {
    try {
      user = await findUser(username);
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

export const storeFavorite = async (
  favoriteData: SaveFavoriteRequest
): Promise<PostFavoriteResponse | ApiError> => {
  let favoritedGames;
  try {
    favoritedGames = await saveFavorite(favoriteData);
  } catch (error) {
    return {
      message: "Update favorite failure",
      status: "error",
      errorId: "unknown",
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
    errorId: "unknown",
  };
};

export const storeGroup = async (
  username: string,
  isGroupCreator: boolean,
  groupCode: string,
  ownSerial: string,
  leaveGroup = false,
  closeGroup = false
): Promise<PostGroupResponse | PostGroupError> => {
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

    if (isGroupCreator && groupMembers.length > 1) {
      return {
        message: "Creator cannot leave non-empty group",
        status: "error",
        errorId: "creatorCannotLeaveNonEmpty",
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
        errorId: "groupUpdateFailed",
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
        errorId: "groupUpdateFailed",
      };
    }
  }

  // Create group
  if (isGroupCreator) {
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
        errorId: "groupExists",
      };
    }

    if (findGroupResponse) {
      // Group exists
      return {
        message: "Own group already exists",
        status: "error",
        errorId: "groupExists",
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
        errorId: "unknown",
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
        errorId: "unknown",
      };
    }
  }

  // Join group
  if (!isGroupCreator) {
    // Cannot join own group
    if (ownSerial === groupCode) {
      return {
        message: "Cannot join own group",
        status: "error",
        errorId: "cannotJoinOwnGroup",
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
        errorId: "invalidGroupCode",
      };
    }

    // Code is valid
    if (!findSerialResponse) {
      return {
        message: "Invalid group code",
        status: "error",
        errorId: "invalidGroupCode",
      };
    }

    // Check if group creator has created a group
    let findGroupResponse;
    try {
      const creatorUsername = findSerialResponse.username;
      findGroupResponse = await findGroup(groupCode, creatorUsername);
    } catch (error) {
      logger.error(`findGroup(): ${error}`);
      return {
        message: "Error finding group",
        status: "error",
        errorId: "groupDoesNotExist",
      };
    }

    // No existing group, cannot join
    if (!findGroupResponse) {
      return {
        message: "Group does not exist",
        status: "error",
        errorId: "groupDoesNotExist",
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
        errorId: "unknown",
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
        errorId: "unknown",
      };
    }
  }

  return {
    message: "Unknown error",
    status: "error",
    errorId: "unknown",
  };
};

export const fetchGroup = async (
  groupCode: string
): Promise<GetGroupResponse | ApiError> => {
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
      errorId: "unknown",
    };
  }
};

export const login = async (
  username: string,
  password: string
): Promise<PostLoginResponse | PostLoginError> => {
  let user;
  try {
    user = await findUser(username);
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }

  if (!user) {
    logger.info(`Login: User "${username}" not found`);
    return {
      errorId: "loginFailed",
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
      errorId: "unknown",
    };
  }

  if (!settingsResponse.appOpen && user.userGroup === "user") {
    return {
      errorId: "loginDisabled",
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
        errorId: "loginFailed",
        message: "User login error",
        status: "error",
      };
    }
  } catch (error) {
    logger.error(`Login: ${error}`);
    return {
      message: "User login error",
      status: "error",
      errorId: "unknown",
    };
  }
};

export const storeSignedGames = async (
  selectedGames: readonly SelectedGame[],
  username: string,
  signupTime: string
): Promise<PostSignedGamesResponse | PostSignedGamesError> => {
  if (!signupTime) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const validSignupTime = isValidSignupTime(signupTime);
  if (!validSignupTime) {
    return {
      errorId: "signupEnded",
      message: "Signup failure",
      status: "error",
    };
  }

  const modifiedSignupData: UserSignup = {
    signedGames: selectedGames,
    username,
  };

  try {
    const response = await saveSignedGames(modifiedSignupData);
    return {
      message: "Signup success",
      status: "success",
      signedGames: response.signedGames,
    };
  } catch (error) {
    return {
      message: "Signup failure",
      status: "error",
      errorId: "unknown",
    };
  }
};
