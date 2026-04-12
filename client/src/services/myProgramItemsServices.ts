import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteDirectSignupRequest,
  DeleteDirectSignupResponse,
  PostDirectSignupRequest,
  PostDirectSignupResponse,
  PostLotterySignupRequest,
  PostLotterySignupResponse,
  DeleteLotterySignupRequest,
  DeleteLotterySignupResponse,
} from "shared/types/api/myProgramItems";

export const postLotterySignup = async (
  requestData: PostLotterySignupRequest,
): Promise<PostLotterySignupResponse> => {
  const response = await api.post<
    PostLotterySignupResponse,
    PostLotterySignupRequest
  >(ApiEndpoint.LOTTERY_SIGNUP, requestData);
  return response.data;
};

export const deleteLotterySignup = async (
  requestData: DeleteLotterySignupRequest,
): Promise<DeleteLotterySignupResponse> => {
  const response = await api.delete<
    DeleteLotterySignupResponse,
    DeleteLotterySignupRequest
  >(ApiEndpoint.LOTTERY_SIGNUP, { data: requestData });
  return response.data;
};

export const postDirectSignup = async (
  requestData: PostDirectSignupRequest,
): Promise<PostDirectSignupResponse> => {
  const response = await api.post<
    PostDirectSignupResponse,
    PostDirectSignupRequest
  >(ApiEndpoint.DIRECT_SIGNUP, requestData);
  return response.data;
};

export const deleteDirectSignup = async (
  requestData: DeleteDirectSignupRequest,
): Promise<DeleteDirectSignupResponse> => {
  const response = await api.delete<
    DeleteDirectSignupResponse,
    DeleteDirectSignupRequest
  >(ApiEndpoint.DIRECT_SIGNUP, { data: requestData });
  return response.data;
};
