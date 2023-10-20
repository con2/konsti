import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { getTimeNow } from "server/features/player-assignment/utils/getTimeNow";
import { findUserSignups } from "server/features/signup/signupRepository";
import {
  checkGroupExists,
  findGroupMembers,
  saveGroupCode,
  saveGroupCreatorCode,
} from "server/features/user/group/groupRepository";
import { saveSignedGames } from "server/features/user/signed-game/signedGameRepository";
import { findUser } from "server/features/user/userRepository";
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

const generateGroupCode = () => {
  const baseCode = randomBytes(5).toString("hex").substring(0, 9);
  return [
    baseCode.slice(0, 3),
    baseCode.slice(3, 6),
    baseCode.slice(6, 9),
  ].join("-");
};

export const createGroup = async (
  username: string,
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
    timeNow.isBefore(dayjs(userSignup.time)),
  );

  // User cannot have RPG signups in future when creating a group
  if (userHasSignups) {
    return {
      message: "Signup in future",
      status: "error",
      errorId: "userHasSignedGames",
    };
  }

  // Check if group exists or user is already in a group
  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      message: "Error finding user when checking if a group exists",
      status: "error",
      errorId: "errorFindingUser",
    };
  }

  const userResponse = unwrapResult(userResult);
  if (!userResponse) {
    return {
      message: "No matching user found",
      status: "error",
      errorId: "errorFindingUser",
    };
  }

  if (userResponse.groupCode !== "0" || userResponse.groupCreatorCode !== "0") {
    return {
      message: "User has a group or is a member of a group",
      status: "error",
      errorId: "groupExists",
    };
  }

  // No existing group, create
  const newGroupCreatorCode = generateGroupCode();

  const saveGroupResponseResult = await saveGroupCreatorCode(
    newGroupCreatorCode,
    username,
  );
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
): Promise<PostJoinGroupResponse | PostJoinGroupError> => {
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
    timeNow.isBefore(dayjs(userSignup.time)),
  );

  // User cannot have RPG signups in future when joining in group
  if (userHasSignups) {
    return {
      message: "Signup in future",
      status: "error",
      errorId: "userHasSignedGames",
    };
  }

  // Check if user is already in a group (or has created a group)
  const userResult = await findUser(username);
  if (isErrorResult(userResult)) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "errorFindingUser",
    };
  }

  const userResponse = unwrapResult(userResult);
  if (
    userResponse?.groupCode !== "0" ||
    userResponse.groupCreatorCode !== "0"
  ) {
    return {
      message: "User has a group or is a member of a group",
      status: "error",
      errorId: "alreadyInGroup",
    };
  }

  // Check if given group exists
  const groupExistsResult = await checkGroupExists(groupCode);
  if (isErrorResult(groupExistsResult)) {
    return {
      message: "Error in finding group",
      status: "error",
      errorId: "unknown",
    };
  }

  const groupExistsResponse = unwrapResult(groupExistsResult);
  if (!groupExistsResponse) {
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
  username: string,
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
  username: string,
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
    (groupMember) => groupMember.username === username,
  );

  if (groupCreator?.groupCreatorCode !== groupCode) {
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

  const removeGroupCreationCodePromise = await saveGroupCreatorCode(
    "0",
    groupCreator.username,
  );

  if (isErrorResult(removeGroupCreationCodePromise)) {
    return {
      message: "Error deleting group creation code",
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
  groupCode: string,
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
