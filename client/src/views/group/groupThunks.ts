import { postGroup, getGroup } from "client/services/groupServices";
import { AppThunk } from "client/typings/redux.typings";
import {
  submitLeaveGroupAsync,
  submitUpdateGroupAsync,
  submitUpdateGroupCodeAsync,
} from "client/views/login/loginSlice";
import { Group } from "shared/typings/api/groups";

export const submitJoinGroup = (
  group: Group
): AppThunk<Promise<number | undefined>> => {
  return async (dispatch): Promise<number | undefined> => {
    const joinGroupResponse = await postGroup(group);

    if (joinGroupResponse?.status === "error") {
      return joinGroupResponse.code;
    }

    if (joinGroupResponse?.status === "success") {
      dispatch(submitGetGroup(joinGroupResponse.groupCode, group.username));
      dispatch(submitUpdateGroupCodeAsync(joinGroupResponse.groupCode));
    }
  };
};

export const submitCreateGroup = (group: Group): AppThunk => {
  return async (dispatch): Promise<void> => {
    const createGroupResponse = await postGroup(group);

    if (createGroupResponse?.status === "error") {
      return await Promise.reject(createGroupResponse);
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
): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getGroupResponse = await getGroup(groupCode, username);

    if (getGroupResponse?.status === "error") {
      return await Promise.reject(getGroupResponse);
    }

    if (getGroupResponse?.status === "success") {
      dispatch(submitUpdateGroupAsync(getGroupResponse.results));
    }
  };
};

export const submitLeaveGroup = (
  group: Group
): AppThunk<Promise<number | undefined>> => {
  return async (dispatch): Promise<number | undefined> => {
    const leaveGroupResponse = await postGroup(group);

    if (leaveGroupResponse?.status === "error") {
      return leaveGroupResponse.code;
    }

    if (leaveGroupResponse?.status === "success") {
      dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
    }
  };
};
