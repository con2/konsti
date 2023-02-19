import dayjs, { Dayjs } from "dayjs";
import { ProgramType } from "shared/typings/models/game";
import {
  AssignmentStrategy,
  ConventionName,
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
  CONVENTION_NAME: ConventionName;
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

export const sharedConfig: SharedConfig = {
  // App info
  appName: "Konsti",

  // Convention settings
  conventionType: ConventionType.LIVE,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  defaultSignupStrategy: SignupStrategy.ALGORITHM_AND_DIRECT,

  directSignupWindows: {
    tabletopRPG: [],

    larp: [
      // Friday
      {
        signupWindowStart: dayjs("2022-07-29T12:00:00Z"), // Fri 15:00
        signupWindowClose: dayjs("2022-07-29T21:00:00Z"), // Fri 24:00
      },
      // Saturday morning / day
      {
        signupWindowStart: dayjs("2022-07-29T15:00:00Z"), // Fri 18:00
        signupWindowClose: dayjs("2022-07-30T15:00:00Z"), // Sat 18:00
      },
      // Saturday evening
      {
        signupWindowStart: dayjs("2022-07-30T08:00:00Z"), // Sat 11:00
        signupWindowClose: dayjs("2022-07-30T21:00:00Z"), // Sat 24:00
      },
      // Sunday
      {
        signupWindowStart: dayjs("2022-07-30T12:00:00Z"), // Sat 15:00
        signupWindowClose: dayjs("2022-07-31T21:00:00Z"), // Sun 24:00
      },
    ],

    tournament: [
      // Friday to sunday, open whole convention
      {
        signupWindowStart: dayjs("2022-07-29T12:00:00Z"), // Fri 15:00
        signupWindowClose: dayjs("2022-07-31T21:00:00Z"), // Sun 24:00
      },
    ],

    workshop: [
      // Friday to sunday, open whole convention
      {
        signupWindowStart: dayjs("2022-07-29T12:00:00Z"), // Fri 15:00
        signupWindowClose: dayjs("2022-07-31T21:00:00Z"), // Sun 24:00
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
  CONVENTION_NAME: ConventionName.ROPECON,
  CONVENTION_YEAR: "2023",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,

  // Test values
  CONVENTION_START_TIME: "2022-07-29T12:00:00Z", // UTC date
};
