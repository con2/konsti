import { Game } from 'shared/typings/models/game';

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
  USER = 'user',
  ADMIN = 'admin',
  HELP = 'help',
}
