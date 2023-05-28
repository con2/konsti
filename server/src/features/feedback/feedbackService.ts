import { Feedback } from "shared/typings/models/feedback";
import { saveFeedback } from "server/features/feedback/feedbackRepository";
import { PostFeedbackResponse } from "shared/typings/api/feedback";
import { ApiError } from "shared/typings/api/errors";
import { isSuccessResult } from "shared/utils/asyncResult";

export const storeFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse | ApiError> => {
  const feedbackAsyncResult = await saveFeedback(feedbackData);

  if (isSuccessResult(feedbackAsyncResult)) {
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
