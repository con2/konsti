export interface SharedConfig {
  appName: string;
  signupStrategy: SignupStrategy;
  conventionType: ConventionType;
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
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
