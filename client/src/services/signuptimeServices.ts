import { api } from "client/utils/api";
import { SIGNUPTIME_ENDPOINT } from "shared/constants/apiEndpoints";
import { ServerError } from "shared/typings/api/errors";
import { PostSignupTimeResponse } from "shared/typings/api/signup";

export const postSignupTime = async (
  signupTime: string
): Promise<PostSignupTimeResponse | ServerError> => {
  const response = await api.post<PostSignupTimeResponse>(SIGNUPTIME_ENDPOINT, {
    signupTime,
  });
  return response.data;
};
