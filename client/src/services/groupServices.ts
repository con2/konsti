import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import {
  GroupData,
  PostGroupResponse,
  GetGroupResponse,
} from 'typings/group.typings';
import { ServerError } from 'typings/utils.typings';

export const postGroup = async (
  groupData: GroupData
): Promise<PostGroupResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostGroupResponse>('/group', { groupData });
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
    response = await api.get<GetGroupResponse>('/group', {
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
