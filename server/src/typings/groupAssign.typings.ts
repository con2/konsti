import { Result } from 'server/typings/result.typings';

export interface GroupAssignResult {
  score: number;
  signupResults: readonly Result[];
  playerCounter: number;
  gameCounter: number;
}
