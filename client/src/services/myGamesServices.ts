import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteEnteredGameError,
  DeleteEnteredGameRequest,
  DeleteEnteredGameResponse,
  PostEnteredGameError,
  PostEnteredGameRequest,
  PostEnteredGameResponse,
  PostLotterySignupsError,
  PostLotterySignupsRequest,
  PostLotterSignupsResponse,
} from "shared/types/api/myGames";

export const postLotterySignups = async (
  signupData: PostLotterySignupsRequest,
): Promise<PostLotterSignupsResponse | PostLotterySignupsError> => {
  const response = await api.post<
    PostLotterSignupsResponse,
    PostLotterySignupsRequest
  >(ApiEndpoint.LOTTERY_SIGNUP, signupData);
  return response.data;
};

export const postEnteredGame = async (
  requestData: PostEnteredGameRequest,
): Promise<PostEnteredGameResponse | PostEnteredGameError> => {
  const response = await api.post<
    PostEnteredGameResponse,
    PostEnteredGameRequest
  >(ApiEndpoint.SIGNUP, requestData);
  return response.data;
};

export const deleteEnteredGame = async (
  requestData: DeleteEnteredGameRequest,
): Promise<DeleteEnteredGameResponse | DeleteEnteredGameError> => {
  const response = await api.delete<
    DeleteEnteredGameResponse,
    DeleteEnteredGameRequest
  >(ApiEndpoint.SIGNUP, { data: requestData });
  return response.data;
};
