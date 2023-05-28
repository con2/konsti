import { logger } from "server/utils/logger";
import { FeedbackModel } from "server/features/feedback/feedbackSchema";
import { Feedback } from "shared/typings/models/feedback";
import {
  AsyncResult,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/asyncResult";
import { MongoDbError } from "shared/typings/api/errors";

export const saveFeedback = async (
  feedbackData: Feedback
): Promise<AsyncResult<void, MongoDbError>> => {
  const feedback = new FeedbackModel({
    gameId: feedbackData.gameId,
    feedback: feedbackData.feedback,
    username: feedbackData.username,
  });

  try {
    await feedback.save();
  } catch (error) {
    logger.error(`MongoDB: Feedback save error: ${error}`);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }

  logger.info(`MongoDB: Feedback saved successfully`);

  return makeSuccessResult(undefined);
};
