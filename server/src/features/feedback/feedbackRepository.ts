import { logger } from "server/utils/logger";
import { FeedbackModel } from "server/features/feedback/feedbackSchema";
import { Feedback } from "shared/types/models/feedback";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { MongoDbError } from "shared/types/api/errors";

export const saveFeedback = async (
  feedbackData: Feedback,
): Promise<Result<void, MongoDbError>> => {
  const feedback = new FeedbackModel({
    programItemId: feedbackData.programItemId,
    feedback: feedbackData.feedback,
    username: feedbackData.username,
  });

  try {
    await feedback.save();
    logger.info(`MongoDB: Feedback saved successfully`);
    return makeSuccessResult();
  } catch (error) {
    logger.error("MongoDB: Feedback save error: %s", error);
    return makeErrorResult(MongoDbError.UNKNOWN_ERROR);
  }
};
