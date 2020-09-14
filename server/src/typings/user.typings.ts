import mongoose from 'mongoose';
import { Game } from 'typings/game.typings';

export interface UserDoc extends User, mongoose.Document {}

export interface FavoritedGame {
  gameId: string;
}

export interface SignedGame {
  gameDetails: Game;
  priority: number;
  time: string;
}

export interface EnteredGame {
  gameDetails: Game;
  priority: number;
  time: string;
}

export enum UserGroup {
  user = 'user',
  admin = 'admin',
  help = 'help',
}

export interface User {
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  favoritedGames: readonly FavoritedGame[];
  signedGames: readonly SignedGame[];
  enteredGames: readonly EnteredGame[];
  createdAt: string | null;
}

export type UserArray = readonly User[];

export interface NewUserData {
  username: string;
  serial: string;
  passwordHash: string | Promise<void>;
  userGroup?: UserGroup;
  groupCode?: string;
  favoritedGames?: readonly FavoritedGame[];
  signedGames?: readonly SignedGame[];
  enteredGames?: readonly EnteredGame[];
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

export interface GetGroupReturValue {
  groupCode: string;
  signedGames: readonly SignedGame[];
  enteredGames: readonly EnteredGame[];
  serial: string;
  username: string;
}

export interface SaveFavoriteRequest {
  username: string;
  favoritedGames: readonly Game[];
}
