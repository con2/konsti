import mongoose from "mongoose";
import { Game } from "shared/types/models/game";
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
  NO_STARTING_GAMES = "noStartingGames",
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
  selectedGames: readonly Game[];
  playerGroups: readonly User[][];
  allPlayers: readonly User[];
  numberOfIndividuals: Number;
  numberOfGroups: Number;
}

export interface Input {
  list: string;
}
