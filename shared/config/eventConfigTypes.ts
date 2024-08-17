import { Dayjs } from "dayjs";
import { ProgramType } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";

export enum SignupStrategy {
  DIRECT = "direct",
  ALGORITHM = "algorithm",
  ALGORITHM_AND_DIRECT = "algorithm+direct",
}

export enum AssignmentStrategy {
  PADG = "padg",
  RANDOM = "random",
  RANDOM_PADG = "random+padg",
}

export enum LoginProvider {
  LOCAL = "local",
  KOMPASSI = "kompassi",
}

export enum ConventionName {
  ROPECON = "Ropecon",
  HITPOINT = "Tracon Hitpoint",
  SOLMUKOHTA = "Solmukohta",
  TRACON = "Tracon",
}

export type ArrMin1<T> = [T, ...T[]];

export interface SignupWindow {
  signupWindowStart: Dayjs;
  signupWindowClose: Dayjs;
}

export interface EventConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  conventionName: ConventionName;
  conventionYear: string;
  conventionStartTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Partial<
    Record<ProgramType, ArrMin1<SignupWindow>>
  > | null;
  rollingSignupStartProgramTypes: ProgramType[];
  directSignupAlwaysOpenIds: string[];
  requireRegistrationCode: boolean;
  twoPhaseSignupProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonstiOther: string[];
  noKonstiSignupIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: Omit<SignupQuestion, "programItemId"> | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  isEnglishProgramItems: string[];
  logInvalidStartTimes: boolean;
  programTypes: ProgramType[];
}
