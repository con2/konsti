import mongoose, { ObjectId } from "mongoose";
import { ProgramItem } from "shared/types/models/programItem";
import { LotterySignup, User } from "shared/types/models/user";
import { UserAssignmentResult } from "shared/types/models/result";
import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";

export interface ResultDoc
  extends UserAssignmentResult,
    mongoose.Document<ObjectId> {
  algorithm: AssignmentAlgorithm;
  message: string;
}

export interface UserLotterySignups {
  username: string;
  lotterySignups: readonly LotterySignup[];
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
  algorithm: AssignmentAlgorithm;
  status: AssignmentResultStatus;
}

export interface ResultsCollectionEntry {
  assignmentTime: string;
  results: readonly UserAssignmentResult[];
  message: string;
  algorithm: AssignmentAlgorithm;
}

export interface AssignmentAlgorithmResult {
  results: readonly UserAssignmentResult[];
  message: string;
}

export interface RunRandomAndPadgInput {
  lotterySignupProgramItems: readonly ProgramItem[];
  attendeeGroups: readonly User[][];
  allAttendees: readonly User[];
  numberOfIndividuals: number;
  numberOfGroups: number;
}

export interface Input {
  list: string;
}
