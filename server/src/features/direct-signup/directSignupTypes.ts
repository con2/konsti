import mongoose, { ObjectId } from "mongoose";

export interface UserDirectSignup {
  username: string;
  priority: number;
  time: string;
  message: string;
}

export interface DirectSignupsForProgramItem {
  programItemId: string;
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
