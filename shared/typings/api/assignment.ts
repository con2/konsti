import { z } from "zod";
import { AssignmentResult } from "shared/typings/models/result";
import { ApiResult } from "shared/typings/api/errors";

// POST player assignment

export const PostPlayerAssignmentRequestSchema = z.object({
  startTime: z.string().min(1),
});

export type PostPlayerAssignmentRequest = z.infer<
  typeof PostPlayerAssignmentRequestSchema
>;

export interface PostPlayerAssignmentResponse extends ApiResult {
  message: string;
  resultMessage: string;
  results: readonly AssignmentResult[];
  startTime: string;
}
