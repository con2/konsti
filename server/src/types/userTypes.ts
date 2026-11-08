import { UserGroup } from "shared/types/models/user";

export interface NewUser {
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
