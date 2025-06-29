import { isDeepEqual } from "remeda";
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
  CREATOR_UPCOMING_DIRECT_SIGNUPS = "group.error.creatorUpcomingDirectSignups",
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
        case "upcomingDirectSignups":
          return PostCreateGroupErrorMessage.CREATOR_UPCOMING_DIRECT_SIGNUPS;
        case "errorFindingUser":
          return PostCreateGroupErrorMessage.UNKNOWN;
        case "unknown":
          return PostCreateGroupErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(createGroupResponse.errorId);
      }
    }

    await dispatch(submitGetGroup(createGroupResponse.groupCode));
    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: createGroupResponse.groupCode,
        isGroupCreator: true,
      }),
    );
  };
};

export enum PostJoinGroupErrorMessage {
  INVALID_GROUP_CODE = "group.invalidGroupCode",
  GROUP_NOT_EXIST = "group.groupNotExist",
  UNKNOWN = "group.generalGroupError",
  CANNOT_JOIN_OWN_GROUP = "group.error.cannotUseOwnSerial",
  REMOVE_UPCOMING_LOTTERY_SIGNUPS_FAILED = "group.error.removeUpcomingLotterySignupsFailed",
  MEMBER_UPCOMING_DIRECT_SIGNUPS = "group.error.memberUpcomingDirectSignups",
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
        case "removeUpcomingLotterySignupsFailed":
          return PostJoinGroupErrorMessage.REMOVE_UPCOMING_LOTTERY_SIGNUPS_FAILED;
        case "upcomingDirectSignups":
          return PostJoinGroupErrorMessage.MEMBER_UPCOMING_DIRECT_SIGNUPS;
        case "errorFindingUser":
          return PostJoinGroupErrorMessage.UNKNOWN;
        case "alreadyInGroup":
          return PostJoinGroupErrorMessage.ALREADY_IN_GROUP;
        case "unknown":
          return PostJoinGroupErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(joinGroupResponse.errorId);
      }
    }

    await dispatch(submitGetGroup(joinGroupResponse.groupCode));
    dispatch(
      submitUpdateGroupCodeAsync({
        groupCode: joinGroupResponse.groupCode,
        isGroupCreator: false,
      }),
    );
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
          return exhaustiveSwitchGuard(leaveGroupResponse.errorId);
      }
    }

    dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
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
          return exhaustiveSwitchGuard(leaveGroupResponse.errorId);
      }
    }

    dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
  };
};

enum GetGroupErrorMessage {
  UNKNOWN = "group.generalGroupError",
}

export const submitGetGroup = (
  groupCode: string,
): AppThunk<Promise<GetGroupErrorMessage | undefined>> => {
  return async (
    dispatch,
    useState,
  ): Promise<GetGroupErrorMessage | undefined> => {
    const getGroupResponse = await getGroup(groupCode);

    if (getGroupResponse.status === "error") {
      switch (getGroupResponse.errorId) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case "unknown":
          return GetGroupErrorMessage.UNKNOWN;
        default:
          return exhaustiveSwitchGuard(getGroupResponse.errorId);
      }
    }

    const state = useState();

    const updatedGroupMembers = getGroupResponse.results;

    if (!isDeepEqual(state.group.groupMembers, updatedGroupMembers)) {
      dispatch(submitUpdateGroupAsync(updatedGroupMembers));
    }
  };
};
