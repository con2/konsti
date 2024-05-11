import mongoose from "mongoose";
import { ProgramItem } from "shared/types/models/programItem";

export interface UserDirectSignup {
  username: string;
  priority: number;
  time: string;
  message: string;
}

export interface DirectSignupsForProgramItem {
  programItem: ProgramItem;
  userSignups: readonly UserDirectSignup[];
  count?: number;
}

export interface DirectSignupDoc
  extends DirectSignupsForProgramItem,
    mongoose.Document {}
