// Kept apart from the config schema because the settings model needs two of
// these, and the schema in turn needs the settings model's sign-up question:
// with the enums in that same file the two modules would form a runtime cycle,
// and whichever loaded second would see the other's enums as undefined
export enum EventSignupStrategy {
  DIRECT = "direct",
  LOTTERY = "lottery",
  LOTTERY_AND_DIRECT = "lottery+direct",
}

export enum AssignmentAlgorithm {
  PADG = "padg",
  RANDOM = "random",
  RANDOM_PADG = "random+padg",
}

export enum LoginProvider {
  LOCAL = "local",
  KOMPASSI = "kompassi",
  LOCAL_KOMPASSI = "local+kompassi",
}

export enum EventName {
  ROPECON = "Ropecon",
  HITPOINT = "Tracon Hitpoint",
  SOLMUKOHTA = "Solmukohta",
  TRACON = "Tracon",
}

export enum EntryConditionText {
  K16 = "k16",
  K18 = "k18",
}

export enum RemoveLotterySignupsStrategy {
  NONE = "none",
  OVERLAP = "overlap",
  ALL_UPCOMING = "allUpcoming",
}
