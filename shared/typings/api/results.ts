import { z } from "zod";
import { Result } from "shared/typings/models/result";
import { ApiResult } from "shared/typings/api/errors";

// GET results

export const GetResultsRequestSchema = z.object({
  startTime: z.string(),
});

export type GetResultsRequest = z.infer<typeof GetResultsRequestSchema>;

export interface GetResultsResponse extends ApiResult {
  message: string;
  results: readonly Result[];
  startTime: string;
}
