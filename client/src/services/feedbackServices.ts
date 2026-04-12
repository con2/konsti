import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostFeedbackRequest,
  PostFeedbackResponse,
} from "shared/types/api/feedback";

export const postFeedback = async (
  programItemId: string,
  feedback: string,
): Promise<PostFeedbackResponse> => {
  const response = await api.post<PostFeedbackResponse, PostFeedbackRequest>(
    ApiEndpoint.FEEDBACK,
    {
      programItemId,
      feedback,
    },
  );

  return response.data;
};
