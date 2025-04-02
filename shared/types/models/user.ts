import { z } from "zod";
import { EventLogItem } from "shared/types/models/eventLog";
import { ProgramItemSchema } from "shared/types/models/programItem";

export const LotterySignupSchema = z.object({
  programItem: ProgramItemSchema,
  priority: z.number(),
  time: z.string(),
  message: z.string(),
});

export type LotterySignup = z.infer<typeof LotterySignupSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DirectSignupSchema = z.object({
  programItem: ProgramItemSchema,
  priority: z.number(),
  time: z.string(),
  message: z.string(),
});

export type DirectSignup = z.infer<typeof DirectSignupSchema>;

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
  lotterySignups: readonly LotterySignup[];
  createdAt: string;
  eventLogItems: EventLogItem[];
}

export interface UserProgramItems {
  directSignups: readonly DirectSignup[];
  favoriteProgramItemIds: readonly string[];
  lotterySignups: readonly LotterySignup[];
}

export interface NewFavorite {
  username: string;
  favoriteProgramItemIds: string[];
}
