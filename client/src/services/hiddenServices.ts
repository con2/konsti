import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'utils/api';
import { PostHiddenResponse } from 'typings/game.typings';
import { ServerError } from 'typings/utils.typings';
import { Game } from 'common/typings/game';

export const postHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostHiddenResponse>('/hidden', { hiddenData });
  } catch (error) {
    if (error?.response) {
      const axiosError: AxiosError<ServerError> = error;
      if (axiosError.response) return axiosError.response.data;
    }
    throw error;
  }

  return response.data;
};
