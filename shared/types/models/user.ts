import { z } from "zod";
import { EventLogItem } from "shared/types/models/eventLog";
import {
  ProgramItem,
  ProgramItemSchema,
} from "shared/types/models/programItem";

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

export interface UserProgramItems {
  directSignups: readonly Signup[];
  favoritedProgramItems: readonly ProgramItem[];
  lotterySignups: readonly Signup[];
}

export interface NewFavorite {
  username: string;
  favoritedProgramItemIds: string[];
}
