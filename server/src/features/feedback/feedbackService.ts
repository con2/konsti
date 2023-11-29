import { Feedback } from "shared/types/models/feedback";
import { saveFeedback } from "server/features/feedback/feedbackRepository";
import { PostFeedbackResponse } from "shared/types/api/feedback";
import { ApiError } from "shared/types/api/errors";
import { isSuccessResult } from "shared/utils/result";

export const storeFeedback = async (
  feedbackData: Feedback,
): Promise<PostFeedbackResponse | ApiError> => {
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
