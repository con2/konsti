import mongoose from "mongoose";
import { SelectedGame, User, UserGroup } from "shared/typings/models/user";

export interface UserDoc extends User, mongoose.Document {}

export interface NewUserData {
  username: string;
  serial: string;
  passwordHash: string | Promise<void>;
  userGroup?: UserGroup;
  groupCode?: string;
  favoritedGames?: readonly string[];
  signedGames?: readonly SelectedGame[];
  enteredGames?: readonly SelectedGame[];
}

export interface SignupWish {
  username: string;
  gameId: string;
  priority: number;
}

export interface PlayerIdWithPriority {
  playerId: number;
  priorityValue: number;
}

export interface GetGroupReturnValue {
  groupCode: string;
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
  serial: string;
  username: string;
}
