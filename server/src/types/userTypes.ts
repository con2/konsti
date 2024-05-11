import mongoose from "mongoose";
import { User, UserGroup } from "shared/types/models/user";

export interface UserDoc extends User, mongoose.Document {}

export interface NewUser {
  kompassiId: number;
  username: string;
  serial: string;
  passwordHash: string;
  userGroup?: UserGroup;
  groupCode?: string;
  groupCreatorCode?: string;
}

export interface LotterySignup {
  username: string;
  programItemId: string;
  priority: number;
}
