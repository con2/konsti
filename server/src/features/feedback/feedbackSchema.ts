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
    programItemId: { type: String, required: true },
    feedback: { type: String, required: true },
    username: { type: String, required: true },
  },
  { timestamps: true },
);

export const FeedbackModel = mongoose.model("feedback", feedbackSchema);
