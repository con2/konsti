import dayjs from "dayjs";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import { findUserSignups } from "server/features/signup/signupRepository";
import {
  findGroup,
  findGroupMembers,
  saveGroupCode,
} from "server/features/user/group/groupRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findUserSerial } from "server/features/user/userRepository";
import { sharedConfig } from "shared/config/sharedConfig";
import { MongoDbError } from "shared/typings/api/errors";
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
import { ProgramType } from "shared/typings/models/game";
import {
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

const { directSignupAlwaysOpenIds } = sharedConfig;

export const createGroup = async (
  username: string,
  groupCode: string
): Promise<PostCreateGroupResponse | PostCreateGroupError> => {
  const signupsResult = await findUserSignups(username);
  if (isErrorResult(signupsResult)) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsResult);

  const filteredSignups = signups
    .filter((signup) => !directSignupAlwaysOpenIds.includes(signup.game.gameId))
    .filter((signup) => signup.game.programType === ProgramType.TABLETOP_RPG);

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

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
  const findGroupResponseResult = await findGroup(groupCode, username);
  if (isErrorResult(findGroupResponseResult)) {
    return {
      message: "Own group already exists",
      status: "error",
      errorId: "groupExists",
    };
  }

  const findGroupResponse = unwrapResult(findGroupResponseResult);

  if (findGroupResponse) {
    // Group exists
    return {
      message: "Own group already exists",
      status: "error",
      errorId: "groupExists",
    };
  }

  // No existing group, create
  const saveGroupResponseResult = await saveGroupCode(groupCode, username);
  if (isErrorResult(saveGroupResponseResult)) {
    return {
      message: "Save group failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const saveGroupResponse = unwrapResult(saveGroupResponseResult);

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

  const signupsResult = await findUserSignups(username);
  if (isErrorResult(signupsResult)) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsResult);

  const filteredSignups = signups
    .filter((signup) => !directSignupAlwaysOpenIds.includes(signup.game.gameId))
    .filter((signup) => signup.game.programType === ProgramType.TABLETOP_RPG);

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

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
  const findSerialResponseResult = await findUserSerial({
    serial: groupCode,
  });
  if (isErrorResult(findSerialResponseResult)) {
    return {
      message: "Error finding serial",
      status: "error",
      errorId: "invalidGroupCode",
    };
  }

  const findSerialResponse = unwrapResult(findSerialResponseResult);

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
  const findGroupResponseResult = await findGroup(groupCode, creatorUsername);
  if (isErrorResult(findGroupResponseResult)) {
    return {
      message: "Error finding group",
      status: "error",
      errorId: "groupDoesNotExist",
    };
  }

  const findGroupResponse = unwrapResult(findGroupResponseResult);

  if (!findGroupResponse) {
    // No existing group, cannot join
    return {
      message: "Group does not exist",
      status: "error",
      errorId: "groupDoesNotExist",
    };
  }

  // Clean previous signups

  const saveSignedGamesResult = await saveSignedGames({
    signedGames: [],
    username,
  });
  if (isErrorResult(saveSignedGamesResult)) {
    return {
      message: "Error removing previous signups",
      status: "error",
      errorId: "removePreviousSignupsFailed",
    };
  }

  // Group exists, join
  const saveGroupResponseResult = await saveGroupCode(groupCode, username);
  if (isErrorResult(saveGroupResponseResult)) {
    return {
      message: "Error saving group",
      status: "error",
      errorId: "unknown",
    };
  }

  const saveGroupResponse = unwrapResult(saveGroupResponseResult);

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
  const saveGroupResponseResult = await saveGroupCode("0", username);
  if (isErrorResult(saveGroupResponseResult)) {
    return {
      message: "Failed to leave group",
      status: "error",
      errorId: "failedToLeave",
    };
  }

  const saveGroupResponse = unwrapResult(saveGroupResponseResult);

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
  const groupMembersResult = await findGroupMembers(groupCode);
  if (isErrorResult(groupMembersResult)) {
    return {
      message: "Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }

  const groupMembers = unwrapResult(groupMembersResult);

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

  const leaveGroupPromises = groupMembers.map(async (groupMember) => {
    const saveGroupCodeResult = await saveGroupCode("0", groupMember.username);
    if (isErrorResult(saveGroupCodeResult)) {
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult(undefined);
  });

  const results = await Promise.all(leaveGroupPromises);

  const someUpdateFailed = results.some((result) => isErrorResult(result));
  if (someUpdateFailed) {
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
  const findGroupResultsResult = await findGroupMembers(groupCode);
  if (isErrorResult(findGroupResultsResult)) {
    return {
      message: "Getting group members failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const findGroupResults = unwrapResult(findGroupResultsResult);

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
