import { Result } from 'typings/result.typings';

export const SUBMIT_GET_RESULTS = 'SUBMIT_GET_RESULTS';

export interface SubmitGetResultsAsync {
  type: typeof SUBMIT_GET_RESULTS;
  result: readonly Result[];
  startTime: string;
}

export type ResultActionTypes = SubmitGetResultsAsync;
