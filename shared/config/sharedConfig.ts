import {
  AssignmentStrategy,
  SharedConfig,
  ConventionType,
  SignupStrategy,
} from "./sharedConfig.types";

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

  // Algorithm signup settings
  SIGNUP_END_TIME: 30, // minutes
  SIGNUP_OPEN_TIME: 4, // hours

  // Convention details
  CONVENTION_NAME: "Ropecon" as const,
  CONVENTION_YEAR: "2022",
  CONVENTION_START_TIME: "2022-07-30T07:00:00Z", // UTC date
  DAY_START_TIME: 8, // 08:00
};
