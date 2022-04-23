import { Feedback } from "shared/typings/models/feedback";
import { saveFeedback } from "server/features/feedback/feedbackRepository";
import { PostFeedbackResponse } from "shared/typings/api/feedback";
import { ApiError } from "shared/typings/api/errors";

export const storeFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse | ApiError> => {
  try {
    await saveFeedback(feedbackData);
    return {
      message: "Post feedback success",
      status: "success",
    };
  } catch (error) {
    return {
      message: "Post feedback failure",
      status: "error",
      code: 0,
    };
  }
};
