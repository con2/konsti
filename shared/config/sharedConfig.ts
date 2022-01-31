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

  // Convention details
  CONVENTION_NAME: "Ropecon" as const,
  CONVENTION_YEAR: "2022",
  CONVENTION_START_TIME: "2022-07-30T07:00:00Z", // UTC date
};
