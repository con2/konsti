import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupError,
  GetGroupResponse,
  CreateGroupRequest,
  PostCreateGroupError,
  PostGroupResponse,
  JoinGroupRequest,
  LeaveGroupRequest,
  CloseGroupRequest,
  PostJoinGroupError,
  PostLeaveGroupError,
  PostCloseGroupError,
} from "shared/typings/api/groups";

export const postCreateGroup = async (
  groupRequest: CreateGroupRequest
): Promise<PostGroupResponse | PostCreateGroupError> => {
  const response = await api.post<PostGroupResponse>(
    ApiEndpoint.GROUP,
    groupRequest
  );
  return response.data;
};

export const postJoinGroup = async (
  groupRequest: JoinGroupRequest
): Promise<PostGroupResponse | PostJoinGroupError> => {
  const response = await api.post<PostGroupResponse>(
    ApiEndpoint.JOIN_GROUP,
    groupRequest
  );
  return response.data;
};

export const postLeaveGroup = async (
  groupRequest: LeaveGroupRequest
): Promise<PostGroupResponse | PostLeaveGroupError> => {
  const response = await api.post<PostGroupResponse>(
    ApiEndpoint.LEAVE_GROUP,
    groupRequest
  );
  return response.data;
};

export const postCloseGroup = async (
  groupRequest: CloseGroupRequest
): Promise<PostGroupResponse | PostCloseGroupError> => {
  const response = await api.post<PostGroupResponse>(
    ApiEndpoint.CLOSE_GROUP,
    groupRequest
  );
  return response.data;
};

export const getGroup = async (
  groupCode: string,
  username: string
): Promise<GetGroupResponse | GetGroupError> => {
  const response = await api.get<GetGroupResponse>(ApiEndpoint.GROUP, {
    params: {
      groupCode,
      username,
    },
  });
  return response.data;
};
