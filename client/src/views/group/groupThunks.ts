import { postGroup, getGroup } from 'client/services/groupServices';
import { AppThunk } from 'client/typings/redux.typings';
import {
  submitLeaveGroupAsync,
  submitUpdateGroupAsync,
  submitUpdateGroupCodeAsync,
} from 'client/views/login/loginSlice';
import { GroupData } from 'shared/typings/api/groups';

export const submitJoinGroup = (groupData: GroupData): AppThunk => {
  return async (dispatch): Promise<void> => {
    const joinGroupResponse = await postGroup(groupData);

    if (joinGroupResponse?.status === 'error') {
      return await Promise.reject(joinGroupResponse);
    }

    if (joinGroupResponse?.status === 'success') {
      dispatch(submitGetGroup(joinGroupResponse.groupCode, groupData.username));
      dispatch(submitUpdateGroupCodeAsync(joinGroupResponse.groupCode));
    }
  };
};

export const submitCreateGroup = (groupData: GroupData): AppThunk => {
  return async (dispatch): Promise<void> => {
    const createGroupResponse = await postGroup(groupData);

    if (createGroupResponse?.status === 'error') {
      return await Promise.reject(createGroupResponse);
    }

    if (createGroupResponse?.status === 'success') {
      dispatch(
        submitGetGroup(createGroupResponse.groupCode, groupData.username)
      );
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

    if (getGroupResponse?.status === 'error') {
      return await Promise.reject(getGroupResponse);
    }

    if (getGroupResponse?.status === 'success') {
      dispatch(submitUpdateGroupAsync(getGroupResponse.results));
    }
  };
};

export const submitLeaveGroup = (groupData: GroupData): AppThunk => {
  return async (dispatch): Promise<void> => {
    const leaveGroupResponse = await postGroup(groupData);

    if (leaveGroupResponse?.status === 'error') {
      return await Promise.reject(leaveGroupResponse);
    }

    if (leaveGroupResponse?.status === 'success') {
      dispatch(submitLeaveGroupAsync(leaveGroupResponse.groupCode));
    }
  };
};
