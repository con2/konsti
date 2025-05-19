import mongoose from "mongoose";
import { Feedback } from "shared/types/models/feedback";

const feedbackSchema = new mongoose.Schema(
  {
    programItemId: String,
    feedback: String,
    username: String,
  },
  { timestamps: true },
);

interface FeedbackDoc extends Feedback, mongoose.Document {}

export const FeedbackModel = mongoose.model<FeedbackDoc>(
  "feedback",
  feedbackSchema,
);
