import mongoose from "mongoose";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Feedbacks don't have GET endpoint
const FeedbackSchemaDb = z
  .object({
    programItemId: z.string(),
    feedback: z.string(),
    username: z.string(),
  })
  .strip();

const feedbackSchema = new mongoose.Schema(
  {
    programItemId: String,
    feedback: String,
    username: String,
  },
  { timestamps: true },
);

export const FeedbackModel = mongoose.model("feedback", feedbackSchema);
