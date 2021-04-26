import { Result } from 'shared/typings/models/result';

export interface GroupAssignResult {
  score: number;
  signupResults: readonly Result[];
  playerCounter: number;
  gameCounter: number;
}
