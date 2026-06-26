import { randomBytes } from "node:crypto";
import dayjs, { Dayjs } from "dayjs";
import { getTimeNow } from "server/features/assignment/utils/getTimeNow";
import { findUserDirectSignups } from "server/features/direct-signup/directSignupRepository";
import {
  checkGroupExists,
  findGroupMembers,
  saveGroupCode,
  saveGroupCreator,
} from "server/features/user/group/groupRepository";
import { delLotterySignups } from "server/features/user/lottery-signup/lotterySignupRepository";
import { findUser } from "server/features/user/userRepository";
import { MongoDbError } from "shared/types/api/errors";
import {
  PostCloseGroupResponse,
  PostCreateGroupResponse,
  GetGroupResponse,
  PostJoinGroupResponse,
  PostLeaveGroupResponse,
  PostCreateGroupError,
  PostJoinGroupError,
} from "shared/types/api/groups";
import { makeErrorResult, makeSuccessResult } from "shared/utils/result";
import { findProgramItems } from "server/features/program-item/programItemRepository";
import { getLotteryParticipantDirectSignups } from "server/features/assignment/utils/prepareAssignmentParams";
import { ProgramItem } from "shared/types/models/programItem";
import { getLotteryNotYetRunProgramItemIds } from "server/features/assignment/utils/getUpcomingLotterySignups";

export const generateGroupCode = (): string => {
  const baseCode = randomBytes(5).toString("hex").slice(0, 9);
  return [
    baseCode.slice(0, 3),
    baseCode.slice(3, 6),
    baseCode.slice(6, 9),
  ].join("-");
};

const checkUpcomingDirectSignups = async (
  username: string,
  programItems: ProgramItem[],
  timeNow: Dayjs,
): Promise<PostCreateGroupError | PostJoinGroupError | null> => {
  const userDirectSignupsResult = await findUserDirectSignups(username);
  if (!userDirectSignupsResult.ok) {
    return {
      message: "Error finding signups",
      status: "error",
      errorId: "unknown",
    };
  }
  const lotteryParticipantDirectSignups = getLotteryParticipantDirectSignups(
    userDirectSignupsResult.value,
    programItems,
  );

  const userDirectSignupProgramItems = lotteryParticipantDirectSignups.flatMap(
    (signup) => {
      const found = programItems.find(
        (programItem) => programItem.programItemId === signup.programItemId,
      );
      if (!found) {
        return [];
      }
      return found;
    },
  );

  const userHasUpcomingDirectSignups = userDirectSignupProgramItems.some(
    (programItem) => timeNow.isBefore(dayjs(programItem.startTime)),
  );
  if (userHasUpcomingDirectSignups) {
    return {
      message: "User has upcoming direct signups",
      status: "error",
      errorId: "upcomingDirectSignups",
    };
  }

  return null;
};

export const createGroup = async (
  username: string,
): Promise<PostCreateGroupResponse> => {
  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return {
      message: "Error finding program items",
      status: "error",
      errorId: "unknown",
    };
  }

  // User cannot have direct signups in future when joining a group
  const hasUpcomingDirectSignups = await checkUpcomingDirectSignups(
    username,
    programItemsResult.value,
    timeNowResult.value,
  );
  if (hasUpcomingDirectSignups) {
    return hasUpcomingDirectSignups as PostCreateGroupError;
  }

  // Check if group exists or user is already in a group
  const userResult = await findUser(username);
  if (!userResult.ok) {
    return {
      message: "Error finding user when checking if a group exists",
      status: "error",
      errorId: "errorFindingUser",
    };
  }

  const userResponse = userResult.value;
  if (!userResponse) {
    return {
      message: "No matching user found",
      status: "error",
      errorId: "errorFindingUser",
    };
  }

  if (userResponse.groupCode !== "0" || userResponse.isGroupCreator) {
    return {
      message: "User is a creator or a member of a group",
      status: "error",
      errorId: "groupExists",
    };
  }

  // No existing group, create
  const newGroupCode = generateGroupCode();

  const saveGroupResponseResult = await saveGroupCreator(
    newGroupCode,
    true,
    username,
  );
  if (!saveGroupResponseResult.ok) {
    return {
      message: "Save group failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Create group success",
    status: "success",
    groupCode: saveGroupResponseResult.value.groupCode,
  };
};

export const joinGroup = async (
  username: string,
  groupCode: string,
): Promise<PostJoinGroupResponse> => {
  const timeNowResult = await getTimeNow();
  if (!timeNowResult.ok) {
    return {
      message: "Unable to get current time",
      status: "error",
      errorId: "unknown",
    };
  }
  const timeNow = timeNowResult.value;

  const programItemsResult = await findProgramItems();
  if (!programItemsResult.ok) {
    return {
      message: "Error finding program items",
      status: "error",
      errorId: "unknown",
    };
  }
  const programItems = programItemsResult.value;

  // User cannot have direct signups in future when joining a group
  const hasUpcomingDirectSignups = await checkUpcomingDirectSignups(
    username,
    programItems,
    timeNow,
  );
  if (hasUpcomingDirectSignups) {
    return hasUpcomingDirectSignups as PostJoinGroupError;
  }

  // Check if user is already in a group (or has created a group)
  const userResult = await findUser(username);
  if (!userResult.ok) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "errorFindingUser",
    };
  }
  const user = userResult.value;
  if (!user) {
    return {
      message: "User not found",
      status: "error",
      errorId: "unknown",
    };
  }
  if (user.groupCode !== "0" || user.isGroupCreator) {
    return {
      message: "User is a creator or a member of a group",
      status: "error",
      errorId: "alreadyInGroup",
    };
  }

  // Check if given group exists
  const groupExistsResult = await checkGroupExists(groupCode);
  if (!groupExistsResult.ok) {
    return {
      message: "Error finding group",
      status: "error",
      errorId: "unknown",
    };
  }
  if (!groupExistsResult.value) {
    return {
      message: "Group does not exist",
      status: "error",
      errorId: "groupDoesNotExist",
    };
  }

  // Clean lottery signups whose lottery has not yet run
  const lotteryNotYetRunProgramItemIds = getLotteryNotYetRunProgramItemIds(
    user.lotterySignups,
    programItems,
    timeNow,
  );

  if (lotteryNotYetRunProgramItemIds.length > 0) {
    const saveLotterySignupsResult = await delLotterySignups([
      {
        lotterySignupProgramItemIds: lotteryNotYetRunProgramItemIds,
        username,
      },
    ]);
    if (!saveLotterySignupsResult.ok) {
      return {
        message: "Error removing upcoming lottery signups",
        status: "error",
        errorId: "removeUpcomingLotterySignupsFailed",
      };
    }
  }

  // Group exists, join
  const saveGroupResponseResult = await saveGroupCode(groupCode, username);
  if (!saveGroupResponseResult.ok) {
    return {
      message: "Error saving group",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Joined to group success",
    status: "success",
    groupCode: saveGroupResponseResult.value.groupCode,
  };
};

export const leaveGroup = async (
  username: string,
): Promise<PostLeaveGroupResponse> => {
  const userResult = await findUser(username);
  if (!userResult.ok) {
    return {
      message: "Error finding user",
      status: "error",
      errorId: "unknown",
    };
  }
  const user = userResult.value;
  if (!user) {
    return {
      message: "User not found",
      status: "error",
      errorId: "unknown",
    };
  }

  // Group creators must close the group, not leave it (leaving would orphan it)
  if (user.isGroupCreator) {
    return {
      message: "Group creator cannot leave group, close it instead",
      status: "error",
      errorId: "creatorCannotLeave",
    };
  }

  const saveGroupResponseResult = await saveGroupCode("0", username);
  if (!saveGroupResponseResult.ok) {
    return {
      message: "Failed to leave group",
      status: "error",
      errorId: "failedToLeave",
    };
  }

  return {
    message: "Leave group success",
    status: "success",
    groupCode: saveGroupResponseResult.value.groupCode,
  };
};

export const closeGroup = async (
  groupCode: string,
  username: string,
): Promise<PostCloseGroupResponse> => {
  const groupMembersResult = await findGroupMembers(groupCode);
  if (!groupMembersResult.ok) {
    return {
      message: "Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }

  const groupMembers = groupMembersResult.value;

  // Check if group creator, only creator can close group
  const groupCreator = groupMembers.find(
    (groupMember) => groupMember.username === username,
  );

  if (!groupCreator?.isGroupCreator) {
    return {
      message: "Only group creator can close group",
      status: "error",
      errorId: "onlyCreatorCanCloseGroup",
    };
  }

  const leaveGroupPromises = groupMembers.map(async (groupMember) => {
    const saveGroupCodeResult = await saveGroupCode("0", groupMember.username);
    if (!saveGroupCodeResult.ok) {
      return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
    }
    return makeSuccessResult();
  });

  const results = await Promise.all(leaveGroupPromises);

  const someUpdateFailed = results.some((result) => !result.ok);
  if (someUpdateFailed) {
    return {
      message: "Unknown error",
      status: "error",
      errorId: "unknown",
    };
  }

  const removeGroupCreatorResult = await saveGroupCreator(
    "0",
    false,
    groupCreator.username,
  );

  if (!removeGroupCreatorResult.ok) {
    return {
      message: "Error removing group creator status",
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
): Promise<GetGroupResponse> => {
  const findGroupResultsResult = await findGroupMembers(groupCode);
  if (!findGroupResultsResult.ok) {
    return {
      message: "Getting group members failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const returnData = findGroupResultsResult.value.map((result) => ({
    groupCode: result.groupCode,
    isGroupCreator: result.isGroupCreator,
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
