import dayjs, { Dayjs } from "dayjs";
import { ProgramType } from "shared/typings/models/game";
import {
  AssignmentStrategy,
  ConventionType,
  SignupStrategy,
} from "./sharedConfig.types";

interface SignupWindow {
  signupWindowStart: Dayjs;
  signupWindowClose: Dayjs;
}

interface SharedConfig {
  appName: string;
  conventionType: ConventionType;
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  defaultSignupStrategy: SignupStrategy;
  CONVENTION_NAME: string;
  CONVENTION_YEAR: string;
  CONVENTION_START_TIME: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Record<ProgramType, SignupWindow[]>;
  directSignupAlwaysOpen: string[];
  tracesSampleRate: number;
  enableSentryInDev: boolean;
}

// Convention days
const friday = "2022-07-29";
const saturday = "2022-07-30";
const sunday = "2022-07-31";

export const sharedConfig: SharedConfig = {
  // App info
  appName: "Konsti",

  // Convention settings
  conventionType: ConventionType.LIVE,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: false,
  defaultSignupStrategy: SignupStrategy.ALGORITHM_AND_DIRECT,

  directSignupWindows: {
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
      // Friday to sunday, open whole convention
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00
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
  },

  directSignupAlwaysOpen: [
    "p5344", // PFS multi-table special: Pathfinder Society #3-99 Fate in the Future
    "p5825", // Corporations 2.0
  ],

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  CONVENTION_NAME: "Rapucon",
  CONVENTION_YEAR: "2023",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,

  // Test values
  CONVENTION_START_TIME: "2022-07-29T12:00:00Z", // UTC date
};
