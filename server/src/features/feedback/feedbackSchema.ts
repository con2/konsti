import mongoose from "mongoose";
import { FeedbackDoc } from "server/types/feedbackTypes";

const feedbackSchema = new mongoose.Schema(
  {
    gameId: String,
    feedback: String,
    username: String,
  },
  { timestamps: true },
);

export const FeedbackModel = mongoose.model<FeedbackDoc>(
  "feedback",
  feedbackSchema,
);
