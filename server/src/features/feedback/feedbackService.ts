import { logger } from 'server/utils/logger';
import { FeedbackModel } from 'server/features/feedback/feedbackSchema';
import { Feedback } from 'server/typings/feedback.typings';

export const saveFeedback = async (feedbackData: Feedback): Promise<void> => {
  const feedback = new FeedbackModel({
    gameId: feedbackData.gameId,
    feedback: feedbackData.feedback,
  });

  try {
    await feedback.save();
  } catch (error) {
    throw new Error(`MongoDB: Feedback save error: ${error}`);
  }

  logger.info(`MongoDB: Feedback saved successfully`);
};
