import { Feedback } from 'server/typings/feedback.typings';
import { Status } from 'shared/typings/api/games';
import { saveFeedback } from 'server/features/feedback/feedbackRepository';

interface PostFeedbackResponse {
  message: string;
  status: Status;
  error?: Error;
}

export const storeFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse> => {
  try {
    await saveFeedback(feedbackData);
    return {
      message: 'Post feedback success',
      status: 'success',
    };
  } catch (error) {
    return {
      message: 'Post feedback failure',
      status: 'error',
      error,
    };
  }
};
