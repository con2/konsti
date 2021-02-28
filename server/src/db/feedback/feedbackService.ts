import { logger } from 'server/utils/logger';
import { FeedbackModel } from 'server/db/feedback/feedbackSchema';
import { Feedback } from 'server/typings/feedback.typings';

const saveFeedback = async (feedbackData: Feedback): Promise<void> => {
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

export const feedback = {
  saveFeedback,
};
