import mongoose from "mongoose";
import { ProgramItem } from "shared/types/models/programItem";
import { Signup, User } from "shared/types/models/user";
import { AssignmentResult } from "shared/types/models/result";

export interface ResultDoc extends AssignmentResult, mongoose.Document {
  algorithm: string;
  message: string;
}

export interface UserLotterySignups {
  username: string;
  lotterySignups: readonly Signup[];
}

export enum AssignmentResultStatus {
  SUCCESS = "success",
  NO_STARTING_PROGRAM_ITEMS = "noStartingProgramItems",
  NO_SIGNUP_WISHES = "noSignupWishes",
  ERROR = "error",
}

export interface PlayerAssignmentResult {
  results: readonly AssignmentResult[];
  message: string;
  algorithm: string;
  status: AssignmentResultStatus;
}

export interface ResultsCollectionEntry {
  startTime: string;
  results: readonly AssignmentResult[];
  message: string;
  algorithm: string;
}

export interface AssignmentStrategyResult {
  results: readonly AssignmentResult[];
  message: string;
}

export interface RunRandomAndPadgInput {
  lotterySignupProgramItems: readonly ProgramItem[];
  playerGroups: readonly User[][];
  allPlayers: readonly User[];
  numberOfIndividuals: Number;
  numberOfGroups: Number;
}

export interface Input {
  list: string;
}
