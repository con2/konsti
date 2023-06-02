import { Game } from "shared/typings/models/game";

export interface User {
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
  createdAt: string | null;
}

export interface SelectedGame {
  gameDetails: Game;
  priority: number; // TODO: Update to 1 | 2 | 3
  time: string;
  message: string;
}

export enum UserGroup {
  USER = "user",
  ADMIN = "admin",
  HELP = "help",
}

export interface UserGames {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}

export interface NewFavorite {
  username: string;
  favoritedGameIds: string[];
}
