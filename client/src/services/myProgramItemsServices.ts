import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteDirectSignupError,
  DeleteDirectSignupRequest,
  DeleteDirectSignupResponse,
  PostDirectSignupError,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
  PostLotterySignupError,
  PostLotterySignupRequest,
  PostLotterSignupResponse,
  DeleteLotterySignupRequest,
  DeleteLotterySignupResponse,
  DeleteLotterySignupError,
} from "shared/types/api/myProgramItems";

export const postLotterySignup = async (
  requestData: PostLotterySignupRequest,
): Promise<PostLotterSignupResponse | PostLotterySignupError> => {
  const response = await api.post<
    PostLotterSignupResponse,
    PostLotterySignupRequest
  >(ApiEndpoint.LOTTERY_SIGNUP, requestData);
  return response.data;
};

export const deleteLotterySignup = async (
  requestData: DeleteLotterySignupRequest,
): Promise<DeleteLotterySignupResponse | DeleteLotterySignupError> => {
  const response = await api.delete<
    DeleteLotterySignupResponse,
    DeleteLotterySignupRequest
  >(ApiEndpoint.LOTTERY_SIGNUP, { data: requestData });
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
