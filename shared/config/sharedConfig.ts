import {
  AssignmentStrategy,
  ConventionName,
  ConventionType,
  SignupStrategy,
} from "./sharedConfig.types";

interface SharedConfig {
  appName: string;
  conventionType: ConventionType;
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  defaultSignupStrategy: SignupStrategy;
  CONVENTION_NAME: ConventionName;
  CONVENTION_YEAR: string;
  CONVENTION_START_TIME: string;
  SIGNUP_END_TIME: number;
  SIGNUP_OPEN_TIME: number;
  DAY_START_TIME: number;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
}

export const sharedConfig: SharedConfig = {
  // App info
  appName: "Konsti",

  // Convention settings
  conventionType: ConventionType.LIVE,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  defaultSignupStrategy: SignupStrategy.ALGORITHM_AND_DIRECT,

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Algorithm signup settings
  SIGNUP_END_TIME: 30, // minutes
  SIGNUP_OPEN_TIME: 4, // hours

  // Convention details
  CONVENTION_NAME: ConventionName.ROPECON,
  CONVENTION_YEAR: "2022",
  CONVENTION_START_TIME: "2022-07-30T07:00:00Z", // UTC date
  DAY_START_TIME: 8, // 08:00
};
