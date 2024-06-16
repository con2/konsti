import { z } from "zod";
import { EventLogItem } from "shared/types/models/eventLog";
import { ProgramItemSchema } from "shared/types/models/programItem";

export const SignupSchema = z.object({
  programItem: ProgramItemSchema,
  priority: z.number(),
  time: z.string(),
  message: z.string(),
});

export type Signup = z.infer<typeof SignupSchema>;

export enum UserGroup {
  USER = "user",
  ADMIN = "admin",
  HELP = "help",
}

export type FavoriteProgramItemId = string;

export interface User {
  kompassiId: number;
  kompassiUsernameAccepted: boolean;
  username: string;
  password: string;
  userGroup: UserGroup;
  serial: string;
  groupCode: string;
  groupCreatorCode: string;
  favoriteProgramItemIds: readonly FavoriteProgramItemId[];
  lotterySignups: readonly Signup[];
  createdAt: string;
  eventLogItems: EventLogItem[];
}

export interface UserProgramItems {
  directSignups: readonly Signup[];
  favoriteProgramItemIds: readonly string[];
  lotterySignups: readonly Signup[];
}

export interface NewFavorite {
  username: string;
  favoriteProgramItemIds: string[];
}
