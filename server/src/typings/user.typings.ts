import mongoose from "mongoose";
import { User, UserGroup } from "shared/typings/models/user";

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

export interface SignupWish {
  username: string;
  gameId: string;
  priority: number;
}
