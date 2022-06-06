import {
  findGroup,
  findGroupMembers,
  saveGroupCode,
} from "server/features/user/group/groupRepository";
import { findUserSerial } from "server/features/user/userRepository";
import { GetGroupReturnValue } from "server/typings/user.typings";
import { logger } from "server/utils/logger";
import { ApiError } from "shared/typings/api/errors";
import {
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
