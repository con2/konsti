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

// Metadata of a single lottery run, without the per-user results or group snapshots
export interface AssignmentRun {
  assignmentTime: string;
  algorithm: string;
  message: string;
}
