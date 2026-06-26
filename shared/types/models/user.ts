import { EventLogItem } from "shared/types/models/eventLog";

export interface LotterySignup {
  programItemId: string;
  priority: number;
  signedToStartTime: string;
  // Group the user belonged to when making the signup ("0" if not in a group)
  groupCode: string;
}

export interface DirectSignup {
  programItemId: string;
  priority: number;
  signedToStartTime: string;
  message: string;
}

export enum UserGroup {
  USER = "user",
  ADMIN = "admin",
  HELPER = "helper",
}

// TODO: Is this useful?
export type FavoriteProgramItemId = string;

export interface User {
  kompassiId: number;
  kompassiUsernameAccepted: boolean;
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  isGroupCreator: boolean;
  favoriteProgramItemIds: readonly FavoriteProgramItemId[];
  lotterySignups: readonly LotterySignup[];
  createdAt: string;
  eventLogItems: EventLogItem[];
  email: string;
  emailNotificationPermitAsked: boolean;
}

export interface UserProgramItems {
  directSignups: readonly DirectSignup[];
  favoriteProgramItemIds: readonly string[];
  lotterySignups: readonly LotterySignup[];
}

export interface NewFavorite {
  username: string;
  favoriteProgramItemIds: string[];
}
