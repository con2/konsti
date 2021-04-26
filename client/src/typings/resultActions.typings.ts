import { Result } from 'shared/typings/models/result';

export const SUBMIT_GET_RESULTS = 'SUBMIT_GET_RESULTS';

export interface SubmitGetResultsAsync {
  type: typeof SUBMIT_GET_RESULTS;
  result: readonly Result[];
  startTime: string;
}

export type ResultActionTypes = SubmitGetResultsAsync;
