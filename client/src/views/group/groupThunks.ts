import { postGroup, getGroup } from "client/services/groupServices";
import { AppThunk } from "client/typings/redux.typings";
import {
  submitLeaveGroupAsync,
  submitUpdateGroupAsync,
  submitUpdateGroupCodeAsync,
} from "client/views/group/groupSlice";
import { GroupRequest } from "shared/typings/api/groups";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export enum PostGroupErrorMessage {
  INVALID_GROUP_CODE = "group.invalidGroupCode",
  GROUP_NOT_EXIST = "group.groupNotExist",
  UNKNOWN = "group.generalGroupError",
  FAILED_TO_LEAVE = "group.generalLeaveGroupError",
  CANNOT_JOIN_OWN_GROUP = "group.error.cannotUseOwnSerial",
  GROUP_EXISTS = "group.error.groupExists",
  REMOVE_PREVIOUS_SIGNUPS_FAILED = "group.error.removePreviousSignupsFailed",
  EMPTY = "",
}

enum GetGroupErrorMessage {
  UNKNOWN = "group.generalGroupError",
  EMPTY = "",
}

export const submitJoinGroup = (
  groupRequest: GroupRequest
): AppThunk<Promise<PostGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostGroupErrorMessage | undefined> => {
    const joinGroupResponse = await postGroup(groupRequest);

    if (joinGroupResponse?.status === "error") {
      switch (joinGroupResponse.errorId) {
        // Join group
        case "invalidGroupCode":
          return PostGroupErrorMessage.INVALID_GROUP_CODE;
        case "groupDoesNotExist":
          return PostGroupErrorMessage.GROUP_NOT_EXIST;
        case "cannotJoinOwnGroup":
          return PostGroupErrorMessage.CANNOT_JOIN_OWN_GROUP;
        case "removePreviousSignupsFailed":
          return PostGroupErrorMessage.REMOVE_PREVIOUS_SIGNUPS_FAILED;
        // Leave group
        case "failedToLeave":
          return PostGroupErrorMessage.FAILED_TO_LEAVE;
        // Create group
        case "groupExists":
          return PostGroupErrorMessage.GROUP_EXISTS;
        // Unknown
        case "unknown":
          return PostGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(joinGroupResponse.errorId);
      }
    }

    if (joinGroupResponse?.status === "success") {
      dispatch(
        submitGetGroup(joinGroupResponse.groupCode, groupRequest.username)
      );
      dispatch(submitUpdateGroupCodeAsync(joinGroupResponse.groupCode));
    }
  };
};

export const submitCreateGroup = (
  group: GroupRequest
): AppThunk<Promise<PostGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostGroupErrorMessage | undefined> => {
    const createGroupResponse = await postGroup(group);

    if (createGroupResponse?.status === "error") {
      switch (createGroupResponse.errorId) {
        // Join group
        case "invalidGroupCode":
          return PostGroupErrorMessage.INVALID_GROUP_CODE;
        case "groupDoesNotExist":
          return PostGroupErrorMessage.GROUP_NOT_EXIST;
        case "cannotJoinOwnGroup":
          return PostGroupErrorMessage.CANNOT_JOIN_OWN_GROUP;
        case "removePreviousSignupsFailed":
          return PostGroupErrorMessage.REMOVE_PREVIOUS_SIGNUPS_FAILED;
        // Leave group
        case "failedToLeave":
          return PostGroupErrorMessage.FAILED_TO_LEAVE;
        // Create group
        case "groupExists":
          return PostGroupErrorMessage.GROUP_EXISTS;
        // Unknown
        case "unknown":
          return PostGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(createGroupResponse.errorId);
      }
    }

    if (createGroupResponse?.status === "success") {
      dispatch(submitGetGroup(createGroupResponse.groupCode, group.username));
      dispatch(submitUpdateGroupCodeAsync(createGroupResponse.groupCode));
    }
  };
};

export const submitGetGroup = (
  groupCode: string,
  username: string
): AppThunk<Promise<GetGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<GetGroupErrorMessage | undefined> => {
    const getGroupResponse = await getGroup(groupCode, username);

    if (getGroupResponse?.status === "error") {
      switch (getGroupResponse.errorId) {
        case "unknown":
          return GetGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(getGroupResponse.errorId);
      }
    }

    if (getGroupResponse?.status === "success") {
      dispatch(submitUpdateGroupAsync(getGroupResponse.results));
    }
  };
};

export const submitLeaveGroup = (
  groupRequest: GroupRequest
): AppThunk<Promise<PostGroupErrorMessage | undefined>> => {
  return async (dispatch): Promise<PostGroupErrorMessage | undefined> => {
    const leaveGroupResponse = await postGroup(groupRequest);

    if (leaveGroupResponse?.status === "error") {
      switch (leaveGroupResponse.errorId) {
        // Join group
        case "invalidGroupCode":
          return PostGroupErrorMessage.INVALID_GROUP_CODE;
        case "groupDoesNotExist":
          return PostGroupErrorMessage.GROUP_NOT_EXIST;
        case "cannotJoinOwnGroup":
          return PostGroupErrorMessage.CANNOT_JOIN_OWN_GROUP;
        case "removePreviousSignupsFailed":
          return PostGroupErrorMessage.REMOVE_PREVIOUS_SIGNUPS_FAILED;
        // Leave group
        case "failedToLeave":
          return PostGroupErrorMessage.FAILED_TO_LEAVE;
        // Create group
        case "groupExists":
          return PostGroupErrorMessage.GROUP_EXISTS;
        // Unknown
        case "unknown":
          return PostGroupErrorMessage.UNKNOWN;
        default:
          exhaustiveSwitchGuard(leaveGroupResponse.errorId);
      }
    }

    if (leaveGroupResponse?.status === "success") {
      dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
    }
  };
};
