import { AxiosResponse, AxiosError } from "axios";
import { api } from "client/utils/api";
import { ServerError } from "shared/typings/api/errors";
import { FEEDBACK_ENDPOINT } from "shared/constants/apiEndpoints";
import { PostFeedbackResponse } from "shared/typings/api/feedback";
import { Feedback } from "shared/typings/models/feedback";

export const postFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse | ServerError> => {
  let response: AxiosResponse;
  try {
    response = await api.post<PostFeedbackResponse>(FEEDBACK_ENDPOINT, {
      feedback: feedbackData.feedback,
      gameId: feedbackData.gameId,
      username: feedbackData.username,
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
