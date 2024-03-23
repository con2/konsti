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
}

export type ArrMin1<T> = [T, ...T[]];
