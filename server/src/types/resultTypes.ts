import { AssignmentAlgorithm } from "shared/config/eventConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";
import {
  AssignmentResultGroup,
  UserAssignmentResult,
} from "shared/types/models/result";
import { LotterySignup, User } from "shared/types/models/user";

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
  groups: readonly AssignmentResultGroup[];
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
