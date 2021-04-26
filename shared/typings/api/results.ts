import { Result } from 'shared/typings/models/result';

export interface GetResultsResponse {
  message: string;
  results: readonly Result[];
  startTime: string;
  status: 'success';
}
