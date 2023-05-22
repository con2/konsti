import { z } from "zod";
import { Result } from "shared/typings/models/result";

// GET results

export const GetResultsRequestSchema = z.object({
  startTime: z.string(),
});

export type GetResultsRequest = z.infer<typeof GetResultsRequestSchema>;

export interface GetResultsResponse {
  message: string;
  results: readonly Result[];
  startTime: string;
  status: "success";
}
