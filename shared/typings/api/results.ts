import { Result } from 'client/typings/result.typings';

export interface GetResultsResponse {
  message: string;
  results: readonly Result[];
  startTime: string;
  status: 'success';
}
