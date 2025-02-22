import { randomBytes } from "node:crypto";
import dayjs from "dayjs";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { findUserDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  checkGroupExists,
  findGroupMembers,
  saveGroupCode,
  saveGroupCreatorCode,
} from "server/features/user/group/groupRepository";
import { saveLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser } from "server/features/user/userRepository";
import { config } from "shared/config";
import { MongoDbError } from "shared/types/api/errors";
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
} from "shared/types/api/groups";
import {
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";

export const generateGroupCode = (): string => {
  const baseCode = randomBytes(5).toString("hex").slice(0, 9);
  return [
    baseCode.slice(0, 3),
    baseCode.slice(3, 6),
    baseCode.slice(6, 9),
  ].join("-");
};

export const createGroup = async (
  username: string,
): Promise<PostCreateGroupResponse | PostCreateGroupError> => {
  const signupsResult = await findUserDirectSignups(username);
  if (isErrorResult(signupsResult)) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsResult);

  const { directSignupAlwaysOpenIds, twoPhaseSignupProgramTypes } =
    config.event();

  const filteredSignups = signups
    .filter((signup) =>
      twoPhaseSignupProgramTypes.includes(signup.programItem.programType),
    )
    .filter(
      (signup) =>
        !directSignupAlwaysOpenIds.includes(signup.programItem.programItemId),
    );

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

  const userDirectSignups = filteredSignups.flatMap(
    (signup) => signup.userSignups,
  );
  const userHasDirectSignups = userDirectSignups.some((userSignup) =>
    timeNow.isBefore(dayjs(userSignup.time)),
  );

  // User cannot have RPG signups in future when creating a group
  if (userHasDirectSignups) {
    return {
      message: "Signup in future",
      status: "error",
      errorId: "userHasDirectSignups",
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
  const signupsResult = await findUserDirectSignups(username);
  if (isErrorResult(signupsResult)) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }

  const signups = unwrapResult(signupsResult);

  const { directSignupAlwaysOpenIds, twoPhaseSignupProgramTypes } =
    config.event();

  const filteredSignups = signups
    .filter((signup) =>
      twoPhaseSignupProgramTypes.includes(signup.programItem.programType),
    )
    .filter(
      (signup) =>
        !directSignupAlwaysOpenIds.includes(signup.programItem.programItemId),
    );

  const timeNowResult = await getTimeNow();
  if (isErrorResult(timeNowResult)) {
    return {
      message: `Unable to get current time`,
      status: "error",
      errorId: "unknown",
    };
  }

  const timeNow = unwrapResult(timeNowResult);

  const userDirectSignups = filteredSignups.flatMap(
    (signup) => signup.userSignups,
  );
  const userHasDirectSignups = userDirectSignups.some((userSignup) =>
    timeNow.isBefore(dayjs(userSignup.time)),
  );

  // User cannot have RPG signups in future when joining in group
  if (userHasDirectSignups) {
    return {
      message: "Signup in future",
      status: "error",
      errorId: "userHasDirectSignups",
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

  // Clean previous lottery signups
  const saveLotterySignupsResult = await saveLotterySignups({
    lotterySignups: [],
    username,
  });
  if (isErrorResult(saveLotterySignupsResult)) {
    return {
      message: "Error removing previous lottery signups",
      status: "error",
      errorId: "removePreviousLotterySignupsFailed",
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

  const removeGroupCreationCodeResult = await saveGroupCreatorCode(
    "0",
    groupCreator.username,
  );

  if (isErrorResult(removeGroupCreationCodeResult)) {
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
    groupCreatorCode: result.groupCreatorCode,
    lotterySignups: result.lotterySignups,
    serial: result.serial,
    username: result.username,
  }));

  return {
    message: "Getting group members success",
    status: "success",
    results: returnData,
  };
};
