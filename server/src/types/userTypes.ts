import { UserGroup } from "shared/types/models/user";

export interface NewUser {
  // Generated when absent. Only a replayed past event keeps the id its dump recorded.
  userId?: string;
  kompassiId: string;
  username: string;
  serial: string;
  passwordHash: string;
  userGroup?: UserGroup;
  groupCode?: string;
  isGroupCreator?: boolean;
  email?: string;
  emailNotificationPermitAsked?: boolean;
}

export interface AssignmentLotterySignup {
  userId: string;
  programItemId: string;
  priority: number;
  signedToStartTime: string;
}
