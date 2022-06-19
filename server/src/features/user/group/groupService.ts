import {
  findGroup,
  findGroupMembers,
  saveGroupCode,
} from "server/features/user/group/groupRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findUserSerial } from "server/features/user/userRepository";
import { GetGroupReturnValue } from "server/typings/user.typings";
import { logger } from "server/utils/logger";
import {
  GetGroupError,
  GetGroupResponse,
  PostGroupError,
  PostGroupResponse,
} from "shared/typings/api/groups";
import { User } from "shared/typings/models/user";

export const storeGroup = async (
  username: string,
  isGroupCreator: boolean,
  groupCode: string,
  ownSerial: string,
  leaveGroup = false,
  closeGroup = false
): Promise<PostGroupResponse | PostGroupError> => {
  if (isGroupCreator) {
    if (closeGroup) {
      return await closeGroupFunction(groupCode);
    }

    return await createGroup(username, groupCode);
  }

  if (!isGroupCreator) {
    if (leaveGroup) {
      return await leaveGroupFunction(username);
    }

    return await joinGroup(username, groupCode, ownSerial);
  }

  return {
    message: "Unknown error",
    status: "error",
    errorId: "unknown",
  };
};

const createGroup = async (
  username: string,
  groupCode: string
): Promise<PostGroupResponse | PostGroupError> => {
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
  }

  return {
    message: "Save group failure",
    status: "error",
    errorId: "unknown",
  };
};

const joinGroup = async (
  username: string,
  groupCode: string,
  ownSerial: string
): Promise<PostGroupResponse | PostGroupError> => {
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

  if (!findSerialResponse) {
    // Invalid code
    return {
      message: "Invalid group code",
      status: "error",
      errorId: "invalidGroupCode",
    };
  }

  // Check if group with code exists
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

  if (!findGroupResponse) {
    // No existing group, cannot join
    return {
      message: "Group does not exist",
      status: "error",
      errorId: "groupDoesNotExist",
    };
  }

  // Clean previous signups
  try {
    await saveSignedGames({
      signedGames: [],
      username,
    });
  } catch (error) {
    logger.error(`saveSignedGames(): ${error}`);
    return {
      message: "Error removing previous signups",
      status: "error",
      errorId: "removePreviousSignupsFailed",
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
  }

  return {
    message: "Failed to update group",
    status: "error",
    errorId: "unknown",
  };
};

const closeGroupFunction = async (
  groupCode: string
): Promise<PostGroupResponse | PostGroupError> => {
  let groupMembers;
  try {
    groupMembers = await findGroupMembers(groupCode);
  } catch (error) {
    logger.error(`findGroupMembers error: ${error}`);
    return {
      message: "Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }

  try {
    const leaveGroupPromises = groupMembers.map(async (groupMember) => {
      await saveGroupCode("0", groupMember.username);
    });
    await Promise.all(leaveGroupPromises);
  } catch (error) {
    logger.error(`saveGroupCode error: ${error}`);
    return {
      message: "Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Group closed successfully",
    status: "success",
    groupCode: "0",
  };
};

const leaveGroupFunction = async (
  username: string
): Promise<PostGroupResponse | PostGroupError> => {
  let saveGroupResponse;
  try {
    saveGroupResponse = await saveGroupCode("0", username);
  } catch (error) {
    logger.error(`Failed to leave group: ${error}`);
    return {
      message: "Failed to leave group",
      status: "error",
      errorId: "failedToLeave",
    };
  }

  if (saveGroupResponse) {
    return {
      message: "Leave group success",
      status: "success",
      groupCode: saveGroupResponse.groupCode,
    };
  }

  return {
    message: "Failed to leave group",
    status: "error",
    errorId: "failedToLeave",
  };
};

export const fetchGroup = async (
  groupCode: string
): Promise<GetGroupResponse | GetGroupError> => {
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
    logger.error(`Failed to get group: ${error}`);
    return {
      message: "Getting group members failed",
      status: "error",
      errorId: "unknown",
    };
  }
};
