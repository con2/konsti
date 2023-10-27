import { Dayjs } from "dayjs";

export enum SignupStrategy {
  DIRECT = "direct",
  ALGORITHM = "algorithm",
  ALGORITHM_AND_DIRECT = "algorithm+direct",
}

export enum AssignmentStrategy {
  MUNKRES = "munkres",
  GROUP = "group",
  PADG = "padg",
  RANDOM = "random",
  GROUP_PADG = "group+padg",
  RANDOM_PADG = "random+padg",
}

export enum LoginProvider {
  LOCAL = "local",
  KOMPASSI = "kompassi",
}

export enum ConventionName {
  ROPECON = "Ropecon",
  HITPOINT = "Tracon Hitpoint",
}

export type ArrMin1<T> = [T, ...T[]];

export interface SignupWindow {
  signupWindowStart: Dayjs;
  signupWindowClose: Dayjs;
}
