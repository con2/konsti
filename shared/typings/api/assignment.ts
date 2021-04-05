import { Result } from 'client/typings/result.typings';

export interface PostPlayerAssignmentResponse {
  message: string;
  resultMessage: string;
  results: readonly Result[];
  startTime: string;
  status: 'success';
}
