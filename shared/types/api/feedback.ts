import { z } from "zod";
import { ApiResult } from "shared/types/api/errors";

// POST feedback

export const PostFeedbackRequestSchema = z.object({
  programItemId: z.string(),
  feedback: z.string(),
});

export type PostFeedbackRequest = z.infer<typeof PostFeedbackRequestSchema>;

export type PostFeedbackResponse = ApiResult;
