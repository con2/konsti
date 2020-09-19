import { postGroup, getGroup } from 'services/groupServices';
import { GroupData, GroupMember } from 'typings/group.typings';
import { AppThunk } from 'typings/utils.typings';
import {
  SubmitUpdateGroupCodeAsync,
  SubmitGetGroupAsync,
  SubmitLeaveGroupAsync,
  SUBMIT_UPDATE_GROUP_CODE,
  SUBMIT_LEAVE_GROUP,
  SUBMIT_UPDATE_GROUP_MEMBERS,
} from 'typings/groupActions.typings';

export const submitJoinGroup = (groupData: GroupData): AppThunk => {
  return async (dispatch): Promise<void> => {
    const joinGroupResponse = await postGroup(groupData);

    if (joinGroupResponse?.status === 'error') {
      return await Promise.reject(joinGroupResponse);
    }

    if (joinGroupResponse?.status === 'success') {
      dispatch(submitGetGroup(joinGroupResponse.groupCode));
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
      dispatch(submitGetGroup(createGroupResponse.groupCode));
      dispatch(submitUpdateGroupCodeAsync(createGroupResponse.groupCode));
    }
  };
};

const submitUpdateGroupCodeAsync = (
  groupCode: string
): SubmitUpdateGroupCodeAsync => {
  return {
    type: SUBMIT_UPDATE_GROUP_CODE,
    groupCode,
  };
};

export const submitGetGroup = (groupCode: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getGroupResponse = await getGroup(groupCode);

    if (getGroupResponse?.status === 'error') {
      return await Promise.reject(getGroupResponse);
    }

    if (getGroupResponse?.status === 'success') {
      dispatch(submitGetGroupAsync(getGroupResponse.results));
    }
  };
};

const submitGetGroupAsync = (
  groupMembers: readonly GroupMember[]
): SubmitGetGroupAsync => {
  return {
    type: SUBMIT_UPDATE_GROUP_MEMBERS,
    groupMembers,
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

const submitLeaveGroupAsync = (groupCode: string): SubmitLeaveGroupAsync => {
  return {
    type: SUBMIT_LEAVE_GROUP,
    groupCode,
  };
};
