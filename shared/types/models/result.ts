import { LotterySignup } from "shared/types/models/user";

export type AssignmentSignup = LotterySignup;

export interface UserAssignmentResult {
  username: string;
  assignmentSignup: AssignmentSignup;
}

// Snapshot of a group that took part in the lottery, as it was when the assignment ran
export interface AssignmentResultGroup {
  groupCode: string;
  groupCreator: string;
  groupMembers: string[];
}
