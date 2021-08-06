import { AxiosResponse, AxiosError } from "axios";
import { api } from "client/utils/api";
import { SIGNUPTIME_ENDPOINT } from "shared/constants/apiEndpoints";
import { ServerError } from "shared/typings/api/errors";
import { PostSignupTimeResponse } from "shared/typings/api/signup";

export const postSignupTime = async (
  signupTime: string
): Promise<PostSignupTimeResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostSignupTimeResponse>(SIGNUPTIME_ENDPOINT, {
      signupTime,
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
