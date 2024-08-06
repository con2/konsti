import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupError,
  GetGroupResponse,
  PostCreateGroupError,
  PostJoinGroupRequest,
  PostCloseGroupRequest,
  PostJoinGroupError,
  PostLeaveGroupError,
  PostCloseGroupError,
  PostCreateGroupResponse,
  PostJoinGroupResponse,
  PostLeaveGroupResponse,
  PostCloseGroupResponse,
  GetGroupRequest,
} from "shared/types/api/groups";

export const postCreateGroup = async (): Promise<
  PostCreateGroupResponse | PostCreateGroupError
> => {
  const response = await api.post<PostCreateGroupResponse>(ApiEndpoint.GROUP);
  return response.data;
};

export const postJoinGroup = async (
  groupRequest: PostJoinGroupRequest,
): Promise<PostJoinGroupResponse | PostJoinGroupError> => {
  const response = await api.post<PostJoinGroupResponse, PostJoinGroupRequest>(
    ApiEndpoint.JOIN_GROUP,
    groupRequest,
  );
  return response.data;
};

export const postLeaveGroup = async (): Promise<
  PostLeaveGroupResponse | PostLeaveGroupError
> => {
  const response = await api.post<PostLeaveGroupResponse>(
    ApiEndpoint.LEAVE_GROUP,
  );
  return response.data;
};

export const postCloseGroup = async (
  groupRequest: PostCloseGroupRequest,
): Promise<PostCloseGroupResponse | PostCloseGroupError> => {
  const response = await api.post<
    PostCloseGroupResponse,
    PostCloseGroupRequest
  >(ApiEndpoint.CLOSE_GROUP, groupRequest);
  return response.data;
};

export const getGroup = async (
  groupCode: string,
): Promise<GetGroupResponse | GetGroupError> => {
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
