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

  // Convention info
  CONVENTION_NAME: ConventionName.ROPECON,
  CONVENTION_YEAR: "2022",

  // Test values
  CONVENTION_START_TIME: "2022-07-30T07:00:00Z", // UTC date
};
