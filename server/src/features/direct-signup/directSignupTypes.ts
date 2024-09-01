import mongoose, { ObjectId } from "mongoose";
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
    mongoose.Document<ObjectId> {}

export interface SignupRepositoryAddSignup {
  username: string;
  directSignupProgramItemId: string;
  message: string;
  priority: number;
  startTime: string;
}

export interface SignupRepositoryAddSignupResponse {
  modifiedCount: number;
  droppedSignups: SignupRepositoryAddSignup[];
}

export interface SignupRepositoryDeleteSignup {
  username: string;
  directSignupProgramItemId: string;
}
