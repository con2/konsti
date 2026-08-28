import { z } from "zod";
import { ApiError, ApiResult } from "shared/types/api/errors";
import { UserAssignmentResult } from "shared/types/models/result";

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

export interface PostAssignmentError extends ApiError {
  errorId: "unknown" | "assignmentInProgress" | "directSignupAlreadyOpen";
}

export type PostAssignmentResponse = PostAssignmentResult | PostAssignmentError;
