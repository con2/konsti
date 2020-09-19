import mongoose from 'mongoose';
import { FeedbackDoc } from 'typings/feedback.typings';

const feedbackSchema = new mongoose.Schema(
  {
    gameId: String,
    feedback: String,
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model<FeedbackDoc>(
  'Feedback',
  feedbackSchema
);
