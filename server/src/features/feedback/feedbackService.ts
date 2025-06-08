import { Feedback } from "shared/types/models/feedback";
import { saveFeedback } from "server/features/feedback/feedbackRepository";
import {
  PostFeedbackError,
  PostFeedbackResponse,
} from "shared/types/api/feedback";
import { isSuccessResult } from "shared/utils/result";

export const storeFeedback = async (
  feedbackData: Feedback,
): Promise<PostFeedbackResponse | PostFeedbackError> => {
  const feedbackResult = await saveFeedback(feedbackData);

  if (isSuccessResult(feedbackResult)) {
    return {
      message: "Post feedback success",
      status: "success",
    };
  }

  return {
    message: "Post feedback failure",
    status: "error",
    errorId: "unknown",
  };
};
