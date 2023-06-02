import { AssignmentResult } from "shared/typings/models/result";

export interface GroupAssignResult {
  score: number;
  signupResults: readonly AssignmentResult[];
  playerCounter: number;
  gameCounter: number;
}
