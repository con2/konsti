import mongoose from "mongoose";
import { RequiredString } from "server/db/mongooseTypes";
import { FeedbackDoc } from "server/typings/feedback.typings";

const feedbackSchema = new mongoose.Schema(
  {
    gameId: RequiredString,
    feedback: RequiredString,
    username: RequiredString,
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model<FeedbackDoc>(
  "Feedback",
  feedbackSchema
);
