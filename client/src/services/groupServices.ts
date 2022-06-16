import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupError,
  GetGroupResponse,
  GroupRequest,
  PostGroupError,
  PostGroupResponse,
} from "shared/typings/api/groups";

export const postGroup = async (
  groupRequest: GroupRequest
): Promise<PostGroupResponse | PostGroupError> => {
  const response = await api.post<PostGroupResponse>(
    ApiEndpoint.GROUP,
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
