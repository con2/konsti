import mongoose, { ObjectId } from "mongoose";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, User } from "shared/types/models/user";
import { UserAssignmentResult } from "shared/types/models/result";

export interface ResultDoc
  extends UserAssignmentResult,
    mongoose.Document<ObjectId> {
  algorithm: string;
  message: string;
}

// For saving new signups to DB where program item is replaced with ObjectId _id
export type NewSignup = Omit<Signup, "programItem"> & {
  programItem: ObjectId;
};

export interface UserLotterySignups {
  username: string;
  lotterySignups: readonly Signup[];
}

export enum AssignmentResultStatus {
  SUCCESS = "success",
  NO_STARTING_PROGRAM_ITEMS = "noStartingProgramItems",
  NO_LOTTERY_SIGNUPS = "noLotterySignups",
  ERROR = "error",
}

export interface AssignmentResult {
  results: readonly UserAssignmentResult[];
  message: string;
  algorithm: string;
  status: AssignmentResultStatus;
}

export interface ResultsCollectionEntry {
  startTime: string;
  results: readonly UserAssignmentResult[];
  message: string;
  algorithm: string;
}

export interface AssignmentStrategyResult {
  results: readonly UserAssignmentResult[];
  message: string;
}

export interface RunRandomAndPadgInput {
  lotterySignupProgramItems: readonly ProgramItem[];
  attendeeGroups: readonly User[][];
  allAttendees: readonly User[];
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  numberOfIndividuals: Number;
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  numberOfGroups: Number;
}

export interface Input {
  list: string;
}
