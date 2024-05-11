import mongoose from "mongoose";
import { FeedbackDoc } from "server/types/feedbackTypes";

const feedbackSchema = new mongoose.Schema(
  {
    programItemId: String,
    feedback: String,
    username: String,
  },
  { timestamps: true },
);

export const FeedbackModel = mongoose.model<FeedbackDoc>(
  "feedback",
  feedbackSchema,
);
