import {
  AssignmentStrategy,
  SharedConfig,
  ConventionType,
} from "./sharedConfig.types";

export const sharedConfig: SharedConfig = {
  // App info
  appName: "Konsti",

  // Convention settings
  conventionType: ConventionType.REMOTE,
  assignmentStrategy: AssignmentStrategy.GROUP_PADG,
  enableGroups: false,

  // Two phase signup settings
  DIRECT_SIGNUP_START: 60 * 4, // minutes
  PRE_SIGNUP_START: 60 * 2, // minutes

  // Algorithm signup settings
  SIGNUP_END_TIME: 30, // minutes
  SIGNUP_OPEN_TIME: 4, // hours

  // Convention details
  CONVENTION_NAME: "Ropecon" as const,
  CONVENTION_YEAR: "2022",
  CONVENTION_START_TIME: "2022-07-30T07:00:00Z", // UTC date
  DAY_START_TIME: 8, // 08:00
};
