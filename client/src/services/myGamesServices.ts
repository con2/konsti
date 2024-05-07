import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteDirectSignupError,
  DeleteDirectSignupRequest,
  DeleteDirectSignupResponse,
  PostDirectSignupError,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
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

export const postDirectSignup = async (
  requestData: PostDirectSignupRequest,
): Promise<PostDirectSignupResponse | PostDirectSignupError> => {
  const response = await api.post<
    PostDirectSignupResponse,
    PostDirectSignupRequest
  >(ApiEndpoint.DIRECT_SIGNUP, requestData);
  return response.data;
};

export const deleteDirectSignup = async (
  requestData: DeleteDirectSignupRequest,
): Promise<DeleteDirectSignupResponse | DeleteDirectSignupError> => {
  const response = await api.delete<
    DeleteDirectSignupResponse,
    DeleteDirectSignupRequest
  >(ApiEndpoint.DIRECT_SIGNUP, { data: requestData });
  return response.data;
};
