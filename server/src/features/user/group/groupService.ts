import dayjs from "dayjs";
import { getTime } from "server/features/player-assignment/utils/getTime";
import { findUserSignups } from "server/features/signup/signupRepository";
import {
  findGroup,
  findGroupMembers,
  saveGroupCode,
} from "server/features/user/group/groupRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findUserSerial } from "server/features/user/userRepository";
import { logger } from "server/utils/logger";
import { sharedConfig } from "shared/config/sharedConfig";
import {
  PostCloseGroupResponse,
  PostCreateGroupResponse,
  GetGroupError,
  GetGroupResponse,
  PostJoinGroupResponse,
  PostLeaveGroupResponse,
  PostCloseGroupError,
  PostCreateGroupError,
  PostJoinGroupError,
  PostLeaveGroupError,
} from "shared/typings/api/groups";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

const { directSignupAlwaysOpenIds } = sharedConfig;

export const createGroup = async (
  username: string,
  groupCode: string
): Promise<PostCreateGroupResponse | PostCreateGroupError> => {
  const signupsAsyncResult = await findUserSignups(username);
  if (isErrorResult(signupsAsyncResult)) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsAsyncResult);

  const filteredSignups = signups.filter(
    (signup) => !directSignupAlwaysOpenIds.includes(signup.game.gameId)
  );

  const timeNow = await getTime();
  const userSignups = filteredSignups.flatMap((signup) => signup.userSignups);
  const userHasSignups = userSignups.some((userSignup) =>
    timeNow.isBefore(dayjs(userSignup.time))
  );

  // User cannot have signups in future when creating a group
  if (userHasSignups) {
    return {
      message: "Signup in future",
      status: "error",
      errorId: "userHasSignedGames",
    };
  }

  // Check if group exists
  const findGroupResponseAsyncResult = await findGroup(groupCode, username);
  if (isErrorResult(findGroupResponseAsyncResult)) {
    return {
      message: "Own group already exists",
      status: "error",
      errorId: "groupExists",
    };
  }

  const findGroupResponse = unwrapResult(findGroupResponseAsyncResult);

  if (findGroupResponse) {
    // Group exists
    return {
      message: "Own group already exists",
      status: "error",
      errorId: "groupExists",
    };
  }

  // No existing group, create
  const saveGroupResponseAsyncResult = await saveGroupCode(groupCode, username);
  if (isErrorResult(saveGroupResponseAsyncResult)) {
    return {
      message: "Save group failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const saveGroupResponse = unwrapResult(saveGroupResponseAsyncResult);

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
): Promise<PostJoinGroupResponse | PostJoinGroupError> => {
  // Cannot join own group
  if (ownSerial === groupCode) {
    return {
      message: "Cannot join own group",
      status: "error",
      errorId: "cannotJoinOwnGroup",
    };
  }

  const signupsAsyncResult = await findUserSignups(username);
  if (isErrorResult(signupsAsyncResult)) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsAsyncResult);

  const filteredSignups = signups.filter(
    (signup) => !directSignupAlwaysOpenIds.includes(signup.game.gameId)
  );

  const timeNow = await getTime();
  const userSignups = filteredSignups.flatMap((signup) => signup.userSignups);
  const userHasSignups = userSignups.some((userSignup) =>
    timeNow.isBefore(dayjs(userSignup.time))
  );

  // User cannot have signups in future when joining in group
  if (userHasSignups) {
    return {
      message: "Signup in future",
      status: "error",
      errorId: "userHasSignedGames",
    };
  }

  // Check if code is valid
  const findSerialResponseAsyncResult = await findUserSerial({
    serial: groupCode,
  });
  if (isErrorResult(findSerialResponseAsyncResult)) {
    return {
      message: "Error finding serial",
      status: "error",
      errorId: "invalidGroupCode",
    };
  }

  const findSerialResponse = unwrapResult(findSerialResponseAsyncResult);

  if (!findSerialResponse?.serial) {
    // Invalid code
    return {
      message: "Invalid group code",
      status: "error",
      errorId: "invalidGroupCode",
    };
  }

  // Check if group with code exists
  const creatorUsername = findSerialResponse.username;
  const findGroupResponseAsyncResult = await findGroup(
    groupCode,
    creatorUsername
  );
  if (isErrorResult(findGroupResponseAsyncResult)) {
    return {
      message: "Error finding group",
      status: "error",
      errorId: "groupDoesNotExist",
    };
  }

  const findGroupResponse = unwrapResult(findGroupResponseAsyncResult);

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
  const saveGroupResponseAsyncResult = await saveGroupCode(groupCode, username);
  if (isErrorResult(saveGroupResponseAsyncResult)) {
    return {
      message: "Error saving group",
      status: "error",
      errorId: "unknown",
    };
  }

  const saveGroupResponse = unwrapResult(saveGroupResponseAsyncResult);

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
): Promise<PostLeaveGroupResponse | PostLeaveGroupError> => {
  const saveGroupResponseAsyncResult = await saveGroupCode("0", username);
  if (isErrorResult(saveGroupResponseAsyncResult)) {
    return {
      message: "Failed to leave group",
      status: "error",
      errorId: "failedToLeave",
    };
  }

  const saveGroupResponse = unwrapResult(saveGroupResponseAsyncResult);

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
): Promise<PostCloseGroupResponse | PostCloseGroupError> => {
  const groupMembersAsyncResult = await findGroupMembers(groupCode);
  if (isErrorResult(groupMembersAsyncResult)) {
    return {
      message: "Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }

  const groupMembers = unwrapResult(groupMembersAsyncResult);

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
  const findGroupResultsAsyncResult = await findGroupMembers(groupCode);
  if (isErrorResult(findGroupResultsAsyncResult)) {
    return {
      message: "Getting group members failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const findGroupResults = unwrapResult(findGroupResultsAsyncResult);

  const returnData = findGroupResults.map((result) => ({
    groupCode: result.groupCode,
    signedGames: result.signedGames,
    serial: result.serial,
    username: result.username,
  }));

  return {
    message: "Getting group members success",
    status: "success",
    results: returnData,
  };
};
