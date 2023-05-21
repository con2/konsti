import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFeedbackRequest,
  PostFeedbackResponse,
} from "shared/typings/api/feedback";
import { Feedback } from "shared/typings/models/feedback";

export const postFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse | ApiError> => {
  const response = await api.post<PostFeedbackResponse, PostFeedbackRequest>(
    ApiEndpoint.FEEDBACK,
    {
      feedback: feedbackData.feedback,
      gameId: feedbackData.gameId,
      username: feedbackData.username,
    }
  );

  return response.data;
};
