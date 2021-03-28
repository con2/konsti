import { logger } from 'server/utils/logger';
import { Feedback } from 'server/typings/feedback.typings';
import { Status } from 'shared/typings/api/games';
import { saveFeedback } from 'server/features/feedback/feedbackService';

interface PostFeedbackResponse {
  message: string;
  status: Status;
  error?: Error;
}

// Post feedback data
export const postFeedback = async (
  feedbackData: Feedback
): Promise<PostFeedbackResponse> => {
  logger.info('API call: POST /api/feedback');

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
