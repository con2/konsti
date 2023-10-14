import { z } from "zod";
import { ApiResult } from "shared/typings/api/errors";

// POST feedback

export const PostFeedbackRequestSchema = z.object({
  gameId: z.string(),
  feedback: z.string(),
});

export type PostFeedbackRequest = z.infer<typeof PostFeedbackRequestSchema>;

export type PostFeedbackResponse = ApiResult;
