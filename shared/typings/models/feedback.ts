import { z } from "zod";

export const FeedbackSchema = z.object({
  gameId: z.string(),
  feedback: z.string(),
  username: z.string(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;
