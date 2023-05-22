import { z } from "zod";
import { Result } from "shared/typings/models/result";

// POST player assignment

export const PostPlayerAssignmentRequestSchema = z.object({
  startingTime: z.string().min(1),
});

export type PostPlayerAssignmentRequest = z.infer<
  typeof PostPlayerAssignmentRequestSchema
>;

export interface PostPlayerAssignmentResponse {
  message: string;
  resultMessage: string;
  results: readonly Result[];
  startTime: string;
  status: "success";
}
