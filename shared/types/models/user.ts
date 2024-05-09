import { EventLogItem } from "shared/types/models/eventLog";
import { ProgramItem } from "shared/types/models/programItem";

export interface User {
  kompassiId: number;
  kompassiUsernameAccepted: boolean;
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  groupCreatorCode: string;
  favoritedProgramItems: readonly ProgramItem[];
  lotterySignups: readonly Signup[];
  createdAt: string;
  eventLogItems: EventLogItem[];
}

export interface Signup {
  programItemDetails: ProgramItem;
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
  favoritedProgramItems: readonly ProgramItem[];
  lotterySignups: readonly Signup[];
}

export interface NewFavorite {
  username: string;
  favoritedProgramItemIds: string[];
}
