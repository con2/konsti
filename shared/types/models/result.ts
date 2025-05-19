import { LotterySignup } from "shared/types/models/user";

export type AssignmentSignup = LotterySignup;

export interface UserAssignmentResult {
  username: string;
  assignmentSignup: AssignmentSignup;
}
