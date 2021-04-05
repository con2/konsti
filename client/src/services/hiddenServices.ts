import { AxiosResponse, AxiosError } from 'axios';
import { api } from 'client/utils/api';
import { PostHiddenResponse } from 'client/typings/game.typings';
import { ServerError } from 'client/typings/utils.typings';
import { Game } from 'shared/typings/models/game';
import { HIDDEN_ENDPOINT } from 'shared/constants/apiEndpoints';

export const postHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostHiddenResponse>(HIDDEN_ENDPOINT, {
      hiddenData,
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
