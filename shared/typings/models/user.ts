import { EventLogItem } from "shared/typings/models/eventLog";
import { Game } from "shared/typings/models/game";

export interface User {
  kompassiId: number;
  kompassiUsernameAccepted: boolean;
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  groupCreatorCode: string;
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
  createdAt: string;
  eventLogItems: EventLogItem[];
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
