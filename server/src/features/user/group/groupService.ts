import dayjs from "dayjs";
import { getTime } from "server/features/player-assignment/utils/getTime";
import {
  findGroup,
  findGroupMembers,
  saveGroupCode,
} from "server/features/user/group/groupRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findUser, findUserSerial } from "server/features/user/userRepository";
import { GetGroupReturnValue } from "server/typings/user.typings";
import { logger } from "server/utils/logger";
import {
  GetGroupError,
  GetGroupResponse,
  PostCloseGroupError,
  PostCreateGroupError,
  PostGroupResponse,
  PostJoinGroupError,
  PostLeaveGroupError,
} from "shared/typings/api/groups";
import { User } from "shared/typings/models/user";

export const createGroup = async (
  username: string,
  groupCode: string
): Promise<PostGroupResponse | PostCreateGroupError> => {
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

export const joinGroup = async (
  username: string,
  groupCode: string,
  ownSerial: string
): Promise<PostGroupResponse | PostJoinGroupError> => {
  // Cannot join own group
  if (ownSerial === groupCode) {
    return {
      message: "Cannot join own group",
      status: "error",
      errorId: "cannotJoinOwnGroup",
    };
  }

  let userResponse;
  try {
    userResponse = await findUser(username);
  } catch (error) {
    logger.error(`findUser(): ${error}`);
    return {
      message: "Error finding user",
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = await getTime();
  const userHasEnteredGames = userResponse?.enteredGames.some((selectedGame) =>
    timeNow.isBefore(dayjs(selectedGame.time))
  );

  // User cannot have entered games in future when joining in group
  if (userHasEnteredGames) {
    return {
      message: "Entered games in future",
      status: "error",
      errorId: "userHasSignedGames",
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

  if (!findSerialResponse?.serial) {
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

export const leaveGroup = async (
  username: string
): Promise<PostGroupResponse | PostLeaveGroupError> => {
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

export const closeGroup = async (
  groupCode: string,
  username: string
): Promise<PostGroupResponse | PostCloseGroupError> => {
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

  // Check if group creator, only creator can close group
  const groupCreator = groupMembers.find(
    (groupMember) => groupMember.username === username
  );

  if (groupCreator?.serial !== groupCode) {
    return {
      message: "Only group creator can close group",
      status: "error",
      errorId: "onlyCreatorCanCloseGroup",
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
