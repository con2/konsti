import { api } from "client/utils/api";
import { ServerError } from "shared/typings/api/errors";
import { GROUP_ENDPOINT } from "shared/constants/apiEndpoints";
import {
  GetGroupResponse,
  Group,
  PostGroupResponse,
} from "shared/typings/api/groups";

export const postGroup = async (
  group: Group
): Promise<PostGroupResponse | ServerError> => {
  const response = await api.post<PostGroupResponse>(GROUP_ENDPOINT, group);
  return response.data;
};

export const getGroup = async (
  groupCode: string,
  username: string
): Promise<GetGroupResponse | ServerError> => {
  const response = await api.get<GetGroupResponse>(GROUP_ENDPOINT, {
    params: {
      groupCode,
      username,
    },
  });
  return response.data;
};
