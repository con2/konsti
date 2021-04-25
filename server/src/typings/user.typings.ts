import mongoose from 'mongoose';
import { Game } from 'shared/typings/models/game';
import {
  EnteredGame,
  FavoritedGame,
  SignedGame,
  User,
  UserGroup,
} from 'shared/typings/models/user';

export interface UserDoc extends User, mongoose.Document {}

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

export interface GetGroupReturnValue {
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
