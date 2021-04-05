import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import {
  GroupData,
  PostGroupResponse,
  GetGroupResponse,
} from 'client/typings/group.typings';
import { ServerError } from 'client/typings/utils.typings';
import { GROUP_ENDPOINT } from 'shared/constants/apiEndpoints';

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
