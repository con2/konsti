import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFeedbackRequest,
  PostFeedbackResponse,
} from "shared/types/api/feedback";

export const postFeedback = async (
  gameId: string,
  feedback: string,
): Promise<PostFeedbackResponse | ApiError> => {
  const response = await api.post<PostFeedbackResponse, PostFeedbackRequest>(
    ApiEndpoint.FEEDBACK,
    {
      gameId,
      feedback,
    },
  );

  return response.data;
};
