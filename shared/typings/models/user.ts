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
  priority: number;
  time: string;
  message: string;
}

export enum UserGroup {
  USER = "user",
  ADMIN = "admin",
  HELP = "help",
}
