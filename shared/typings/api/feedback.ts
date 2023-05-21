import { z } from "zod";

export const PostFeedbackRequestSchema = z.object({
  gameId: z.string(),
  feedback: z.string(),
  username: z.string(),
});

export type PostFeedbackRequest = z.infer<typeof PostFeedbackRequestSchema>;

export interface PostFeedbackResponse {
  message: string;
  status: "success";
}
