import { z } from "zod";
import { UserAssignmentResult } from "shared/types/models/result";
import { ApiResult } from "shared/types/api/errors";

// GET results

export const GetResultsRequestSchema = z.object({
  startTime: z.string(),
});

export type GetResultsRequest = z.infer<typeof GetResultsRequestSchema>;

export interface GetResultsResponse extends ApiResult {
  results: readonly UserAssignmentResult[];
  startTime: string;
}
