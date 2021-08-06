import { Result } from "shared/typings/models/result";

export interface PostPlayerAssignmentResponse {
  message: string;
  resultMessage: string;
  results: readonly Result[];
  startTime: string;
  status: "success";
}
