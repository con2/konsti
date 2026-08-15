import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupRequest,
  GetGroupResponse,
  PostCloseGroupRequest,
  PostCloseGroupResponse,
  PostCreateGroupResponse,
  PostJoinGroupRequest,
  PostJoinGroupResponse,
  PostLeaveGroupResponse,
} from "shared/types/api/groups";
import { api } from "client/utils/api";

export const postCreateGroup = async (): Promise<PostCreateGroupResponse> => {
  const response = await api.post<PostCreateGroupResponse>(ApiEndpoint.GROUP);
  return response.data;
};

export const postJoinGroup = async (
  groupRequest: PostJoinGroupRequest,
): Promise<PostJoinGroupResponse> => {
  const response = await api.post<PostJoinGroupResponse, PostJoinGroupRequest>(
    ApiEndpoint.JOIN_GROUP,
    groupRequest,
  );
  return response.data;
};

export const postLeaveGroup = async (): Promise<PostLeaveGroupResponse> => {
  const response = await api.post<PostLeaveGroupResponse>(
    ApiEndpoint.LEAVE_GROUP,
  );
  return response.data;
};

export const postCloseGroup = async (
  groupRequest: PostCloseGroupRequest,
): Promise<PostCloseGroupResponse> => {
  const response = await api.post<
    PostCloseGroupResponse,
    PostCloseGroupRequest
  >(ApiEndpoint.CLOSE_GROUP, groupRequest);
  return response.data;
};

export const getGroup = async (
  groupCode: string,
): Promise<GetGroupResponse> => {
  const response = await api.get<GetGroupResponse, GetGroupRequest>(
    ApiEndpoint.GROUP,
    {
      params: {
        groupCode,
      },
    },
  );
  return response.data;
};
