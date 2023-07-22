import dayjs, { Dayjs } from "dayjs";
import { ProgramType } from "shared/typings/models/game";
import { AssignmentStrategy, SignupStrategy } from "./sharedConfig.types";

type ArrMin1<T> = [T, ...T[]];

interface SignupWindow {
  signupWindowStart: Dayjs;
  signupWindowClose: Dayjs;
}

interface SharedConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  defaultSignupStrategy: SignupStrategy;
  CONVENTION_NAME: string;
  CONVENTION_YEAR: string;
  CONVENTION_START_TIME: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Record<ProgramType, ArrMin1<SignupWindow>>;
  directSignupAlwaysOpenIds: string[];
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  requireRegistrationCode: boolean;
  activeProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonsti: string[];
  noKonstiSignupIds: string[];
}

// Convention days
const friday = "2023-07-28";
const saturday = "2023-07-29";
const sunday = "2023-07-30";

export const sharedConfig: SharedConfig = {
  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  defaultSignupStrategy: SignupStrategy.ALGORITHM_AND_DIRECT,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,
  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
    ProgramType.WORKSHOP,
    ProgramType.EXPERIENCE_POINT,
    ProgramType.OTHER,
  ],

  CONVENTION_START_TIME: `${friday}T12:00:00Z`, // UTC date

  directSignupWindows: {
    // @ts-expect-error: RPGs use DIRECT_SIGNUP_START
    tabletopRPG: [],

    larp: [
      // Friday
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00
      },
      // Saturday morning / day
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00
        signupWindowClose: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00
      },
      // Saturday evening
      {
        signupWindowStart: dayjs(`${saturday}T08:00:00Z`), // Sat 11:00
        signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00
      },
      // Sunday
      {
        signupWindowStart: dayjs(`${saturday}T12:00:00Z`), // Sat 15:00
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00
      },
    ],

    tournament: [
      // Friday
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00
      },
      // Saturday
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00
        signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00
      },
      // Sunday
      {
        signupWindowStart: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00
      },
    ],

    workshop: [
      // Friday
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00
      },
      // Saturday morning / day
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00
        signupWindowClose: dayjs(`${saturday}T11:00:00Z`), // Sat 14:00
      },
      // Saturday day / evening
      {
        signupWindowStart: dayjs(`${saturday}T06:00:00Z`), // Sat 09:00
        signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00
      },
      // Saturday evening / sunday morning
      {
        signupWindowStart: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00
        signupWindowClose: dayjs(`${sunday}T11:00:00Z`), // Sun 14:00
      },
      // Sunday
      {
        signupWindowStart: dayjs(`${sunday}T06:00:00Z`), // Sun 09:00
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00
      },
    ],

    experiencePoint: [
      // Whole convention Fri - Sun
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00
      },
    ],

    other: [
      // Whole convention Fri - Sun
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00
      },
    ],
  },

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [
    "dummy_id", // Because tests require this, should be fixed
    // "p6673", // PFS multi-table special: Pathfinder Society #3-98: Expedition into Pallid Peril
  ],

  // These program items are hand picked to be exported from Kompassi
  addToKonsti: [
    "p6787", // KPS-turnaus
  ],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [
    "p6512", // RPG: Charlie ei surffaa - Fri
    "p7023", // RPG: Charlie ei surffaa - Sat
    "p7024", // RPG: Charlie ei surffaa - Sun
    "p6848", // Larp: Johtajakoulutus
    "p6638", // Larp: Kielokoti 1. Pelautus
    "p6999", // Larp: Kielokoti 2. Pelautus
    "p6299", // Larp: Vaeltajalegendat: Sinustako seikkailija!? 1. Pelautus
    "p7006", // Larp: Vaeltajalegendat: Sinustako seikkailija!? 2. Pelautus
  ],

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  CONVENTION_NAME: "Ropecon",
  CONVENTION_YEAR: "2023",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,
};
