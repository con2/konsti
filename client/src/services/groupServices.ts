import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupError,
  GetGroupResponse,
  PostCreateGroupRequest,
  PostCreateGroupError,
  PostJoinGroupRequest,
  PostLeaveGroupRequest,
  PostCloseGroupRequest,
  PostJoinGroupError,
  PostLeaveGroupError,
  PostCloseGroupError,
  PostCreateGroupResponse,
  PostJoinGroupResponse,
  PostLeaveGroupResponse,
  PostCloseGroupResponse,
  GetGroupRequest,
} from "shared/typings/api/groups";

export const postCreateGroup = async (
  groupRequest: PostCreateGroupRequest
): Promise<PostCreateGroupResponse | PostCreateGroupError> => {
  const response = await api.post<
    PostCreateGroupResponse,
    PostCreateGroupRequest
  >(ApiEndpoint.GROUP, groupRequest);
  return response.data;
};

export const postJoinGroup = async (
  groupRequest: PostJoinGroupRequest
): Promise<PostJoinGroupResponse | PostJoinGroupError> => {
  const response = await api.post<PostJoinGroupResponse, PostJoinGroupRequest>(
    ApiEndpoint.JOIN_GROUP,
    groupRequest
  );
  return response.data;
};

export const postLeaveGroup = async (
  groupRequest: PostLeaveGroupRequest
): Promise<PostLeaveGroupResponse | PostLeaveGroupError> => {
  const response = await api.post<
    PostLeaveGroupResponse,
    PostLeaveGroupRequest
  >(ApiEndpoint.LEAVE_GROUP, groupRequest);
  return response.data;
};

export const postCloseGroup = async (
  groupRequest: PostCloseGroupRequest
): Promise<PostCloseGroupResponse | PostCloseGroupError> => {
  const response = await api.post<
    PostCloseGroupResponse,
    PostLeaveGroupRequest
  >(ApiEndpoint.CLOSE_GROUP, groupRequest);
  return response.data;
};

export const getGroup = async (
  groupCode: string,
  username: string
): Promise<GetGroupResponse | GetGroupError> => {
  const response = await api.get<GetGroupResponse, GetGroupRequest>(
    ApiEndpoint.GROUP,
    {
      params: {
        groupCode,
        username,
      },
    }
  );
  return response.data;
};
