import { Game } from "shared/typings/models/game";

export interface User {
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  favoritedGames: readonly FavoritedGame[];
  signedGames: readonly SelectedGame[];
  enteredGames: readonly SelectedGame[];
  createdAt: string | null;
}

export interface FavoritedGame {
  gameId: string;
}

export interface SelectedGame {
  gameDetails: Game;
  priority: number;
  time: string;
  message: string;
}

export enum UserGroup {
  USER = "user",
  ADMIN = "admin",
  HELP = "help",
}
