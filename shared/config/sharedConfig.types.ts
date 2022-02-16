type ConventionName = "Ropecon" | "Tracon Hitpoint";

export interface SharedConfig {
  appName: string;
  conventionType: ConventionType;
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  CONVENTION_NAME: ConventionName;
  CONVENTION_YEAR: string;
  CONVENTION_START_TIME: string;
  SIGNUP_END_TIME: number;
  SIGNUP_OPEN_TIME: number;
  DAY_START_TIME: number;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
}

export enum SignupStrategy {
  DIRECT = "direct",
  ALGORITHM = "algorithm",
  DIRECT_ALGORITHM = "direct+algorithm",
}

export enum ConventionType {
  REMOTE = "remote",
  LIVE = "live",
}

export enum AssignmentStrategy {
  MUNKRES = "munkres",
  GROUP = "group",
  PADG = "padg",
  RANDOM = "random",
  GROUP_PADG = "group+padg",
  RANDOM_PADG = "random+padg",
}
