import {
  postCreateGroup,
  getGroup,
  postJoinGroup,
  postLeaveGroup,
  postCloseGroup,
} from "client/services/groupServices";
import { AppThunk } from "client/types/reduxTypes";
import {
  submitLeaveGroupAsync,
  submitUpdateGroupAsync,
  submitUpdateGroupCodeAsync,
} from "client/views/group/groupSlice";
import {
  PostCloseGroupRequest,
  PostJoinGroupRequest,
} from "shared/types/api/groups";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export enum PostCreateGroupErrorMessage {
  UNKNOWN = "group.generalGroupError",
  GROUP_EXISTS = "group.error.groupExists",
  CREATOR_HAS_DIRECT_SIGNUPS = "group.error.creatorHasDirectSignups",
}

export const submitCreateGroup = (): AppThunk<
  Promise<PostCreateGroupErrorMessage | undefined>
> => {
  return async (dispatch): Promise<PostCreateGroupErrorMessage | undefined> => {
    const createGroupResponse = await postCreateGroup();

    if (createGroupResponse.status === "error") {
      switch (createGroupResponse.errorId) {
        case "groupExists":
          return PostCreateGroupErrorMessage.GROUP_EXISTS;
        case "userHasDirectSignups":
          return PostCreateGroupErrorMessage.CREATOR_HAS_DIRECT_SIGNUPS;
        case "errorFindingUser":
          return PostCreateGroupErrorMessage.UNKNOWN;
        case "unknown":
          return PostCreateGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(createGroupResponse.errorId);
      }
    }

    if (createGroupResponse.status === "success") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch(submitGetGroup(createGroupResponse.groupCode));
      dispatch(
        submitUpdateGroupCodeAsync({
          groupCode: createGroupResponse.groupCode,
          isGroupCreator: true,
        }),
      );
    }
  };
};

export enum PostJoinGroupErrorMessage {
  INVALID_GROUP_CODE = "group.invalidGroupCode",
  GROUP_NOT_EXIST = "group.groupNotExist",
  UNKNOWN = "group.generalGroupError",
  CANNOT_JOIN_OWN_GROUP = "group.error.cannotUseOwnSerial",
  REMOVE_PREVIOUS_LOTTERY_SIGNUPS_FAILED = "group.error.removePreviousLotterySignupsFailed",
  USER_HAS_DIRECT_SIGNUPS = "group.error.userHasDirectSignups",
  ALREADY_IN_GROUP = "group.error.alreadyInGroup",
}

export const submitJoinGroup = (
  groupRequest: PostJoinGroupRequest,
): AppThunk<Promise<PostJoinGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostJoinGroupErrorMessage | undefined> => {
    const joinGroupResponse = await postJoinGroup(groupRequest);

    if (joinGroupResponse.status === "error") {
      switch (joinGroupResponse.errorId) {
        case "invalidGroupCode":
          return PostJoinGroupErrorMessage.INVALID_GROUP_CODE;
        case "groupDoesNotExist":
          return PostJoinGroupErrorMessage.GROUP_NOT_EXIST;
        case "removePreviousLotterySignupsFailed":
          return PostJoinGroupErrorMessage.REMOVE_PREVIOUS_LOTTERY_SIGNUPS_FAILED;
        case "userHasDirectSignups":
          return PostJoinGroupErrorMessage.USER_HAS_DIRECT_SIGNUPS;
        case "errorFindingUser":
          return PostJoinGroupErrorMessage.UNKNOWN;
        case "alreadyInGroup":
          return PostJoinGroupErrorMessage.ALREADY_IN_GROUP;
        case "unknown":
          return PostJoinGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(joinGroupResponse.errorId);
      }
    }

    if (joinGroupResponse.status === "success") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch(submitGetGroup(joinGroupResponse.groupCode));
      dispatch(
        submitUpdateGroupCodeAsync({
          groupCode: joinGroupResponse.groupCode,
          isGroupCreator: false,
        }),
      );
    }
  };
};

export enum PostLeaveGroupErrorMessage {
  UNKNOWN = "group.generalGroupError",
  FAILED_TO_LEAVE = "group.generalLeaveGroupError",
}

export const submitLeaveGroup = (): AppThunk<
  Promise<PostLeaveGroupErrorMessage | undefined>
> => {
  return async (dispatch): Promise<PostLeaveGroupErrorMessage | undefined> => {
    const leaveGroupResponse = await postLeaveGroup();

    if (leaveGroupResponse.status === "error") {
      switch (leaveGroupResponse.errorId) {
        case "failedToLeave":
          return PostLeaveGroupErrorMessage.FAILED_TO_LEAVE;
        case "unknown":
          return PostLeaveGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(leaveGroupResponse.errorId);
      }
    }

    if (leaveGroupResponse.status === "success") {
      dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
    }
  };
};

export enum PostCloseGroupErrorMessage {
  UNKNOWN = "group.generalGroupError",
  ONLY_CREATOR_CAN_CLOSE = "group.error.onlyCreatorCanCloseGroup",
}

export const submitCloseGroup = (
  groupRequest: PostCloseGroupRequest,
): AppThunk<Promise<PostCloseGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostCloseGroupErrorMessage | undefined> => {
    const leaveGroupResponse = await postCloseGroup(groupRequest);

    if (leaveGroupResponse.status === "error") {
      switch (leaveGroupResponse.errorId) {
        case "onlyCreatorCanCloseGroup":
          return PostCloseGroupErrorMessage.ONLY_CREATOR_CAN_CLOSE;
        case "unknown":
          return PostCloseGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(leaveGroupResponse.errorId);
      }
    }

    if (leaveGroupResponse.status === "success") {
      dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
    }
  };
};

enum GetGroupErrorMessage {
  UNKNOWN = "group.generalGroupError",
}

export const submitGetGroup = (
  groupCode: string,
): AppThunk<Promise<GetGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<GetGroupErrorMessage | undefined> => {
    const getGroupResponse = await getGroup(groupCode);

    if (getGroupResponse.status === "error") {
      switch (getGroupResponse.errorId) {
        case "unknown":
          return GetGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(getGroupResponse.errorId);
      }
    }

    if (getGroupResponse.status === "success") {
      dispatch(submitUpdateGroupAsync(getGroupResponse.results));
    }
  };
};
