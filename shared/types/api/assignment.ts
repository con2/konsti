import { z } from "zod";
import { UserAssignmentResult } from "shared/types/models/result";
import { ApiError, ApiResult } from "shared/types/api/errors";

// POST assignment

export const PostAssignmentRequestSchema = z.object({
  assignmentTime: z.string().min(1),
});

export type PostAssignmentRequest = z.infer<typeof PostAssignmentRequestSchema>;

interface PostAssignmentResult extends ApiResult {
  resultMessage: string;
  results: readonly UserAssignmentResult[];
  assignmentTime: string;
}

interface PostAssignmentError extends ApiError {
  errorId: "unknown";
}

export type PostAssignmentResponse = PostAssignmentResult | PostAssignmentError;
