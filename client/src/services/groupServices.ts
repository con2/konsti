import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { GroupData } from 'client/typings/group.typings';
import { ServerError } from 'shared/typings/api/errors';
import { GROUP_ENDPOINT } from 'shared/constants/apiEndpoints';
import { GetGroupResponse, PostGroupResponse } from 'shared/typings/api/groups';

export const postGroup = async (
  groupData: GroupData
): Promise<PostGroupResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostGroupResponse>(GROUP_ENDPOINT, { groupData });
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};

export const getGroup = async (
  groupCode: string
): Promise<GetGroupResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.get<GetGroupResponse>(GROUP_ENDPOINT, {
      params: {
        groupCode,
      },
    });
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
