import { EventLogItem } from "shared/types/models/eventLog";
import { Game } from "shared/types/models/game";

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
  lotterySignups: readonly Signup[];
  createdAt: string;
  eventLogItems: EventLogItem[];
}

export interface Signup {
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

export interface UserGames {
  directSignups: readonly Signup[];
  favoritedGames: readonly Game[];
  lotterySignups: readonly Signup[];
}

export interface NewFavorite {
  username: string;
  favoritedGameIds: string[];
}
