import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  GetGroupResponse,
  GroupRequest,
  PostGroupResponse,
} from "shared/typings/api/groups";

export const postGroup = async (
  groupRequest: GroupRequest
): Promise<PostGroupResponse | ApiError> => {
  const response = await api.post<PostGroupResponse>(
    ApiEndpoint.GROUP,
    groupRequest
  );
  return response.data;
};

export const getGroup = async (
  groupCode: string,
  username: string
): Promise<GetGroupResponse | ApiError> => {
  const response = await api.get<GetGroupResponse>(ApiEndpoint.GROUP, {
    params: {
      groupCode,
      username,
    },
  });
  return response.data;
};
