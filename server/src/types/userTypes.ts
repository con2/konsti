import { UserGroup } from "shared/types/models/user";

export interface NewUser {
  kompassiId: number;
  username: string;
  serial: string;
  passwordHash: string;
  userGroup?: UserGroup;
  groupCode?: string;
  groupCreatorCode?: string;
}

export interface AssignmentLotterySignup {
  username: string;
  programItemId: string;
  priority: number;
  signedToStartTime: string;
}
