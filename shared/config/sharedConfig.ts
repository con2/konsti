import dayjs, { Dayjs } from "dayjs";
import {
  ArrMin1,
  AssignmentStrategy,
  ConventionName,
  SignupStrategy,
} from "shared/config/sharedConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";

export interface SharedConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  conventionName: ConventionName;
  conventionYear: string;
  conventionStartTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupStartTimes: Partial<Record<ProgramType, ArrMin1<Dayjs>>> | null;
  directSignupAlwaysOpenIds: string[];
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  requireRegistrationCode: boolean;
  twoPhaseSignupProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonsti: string[];
  noKonstiSignupIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: Omit<SignupQuestion, "programItemId"> | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  isEnglishProgramItems: string[];
  maxValueLength: number;
}

// Convention days
const friday = "2024-07-19";
const saturday = "2024-07-20";
const sunday = "2024-07-21";

export const sharedConfig: SharedConfig = {
  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  conventionStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3

  directSignupStartTimes: {
    larp: [
      // Friday
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
      // Saturday morning / day
      dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
      // Saturday evening
      dayjs(`${saturday}T08:00:00Z`), // Sat 11:00 GMT+3
      // Sunday
      dayjs(`${saturday}T12:00:00Z`), // Sat 15:00 GMT+3
    ],

    tournament: [
      // Friday
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
      // Saturday
      dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
      // Sunday
      dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
    ],

    workshop: [
      // Friday
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
      // Saturday morning / day
      dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
      // Saturday day / evening
      dayjs(`${saturday}T06:00:00Z`), // Sat 09:00 GMT+3
      // Saturday evening / sunday morning
      dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
      // Sunday
      dayjs(`${sunday}T06:00:00Z`), // Sun 09:00 GMT+3
    ],

    experiencePoint: [
      // Whole convention Fri - Sun
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
    ],

    other: [
      // Whole convention Fri - Sun
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
    ],
  },

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [],

  // These program items are hand picked to be exported from Kompassi
  addToKonsti: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [],

  signupQuestions: [],

  tournamentSignupQuestion: {
    questionFi:
      "Syötä nimesi, sähköpostiosoitteesi ja puhelinnumerosi mahdollista palkintoyhteydenottoa varten.",
    questionEn:
      "Please write your name, email address and phone number in case we need to contact you about a possible award.",
    private: true,
    type: SignupQuestionType.TEXT,
    selectOptions: [],
  },

  tournamentSignupQuestionExcludeIds: [],

  isEnglishProgramItems: [],

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  conventionName: ConventionName.ROPECON,
  conventionYear: "2024",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,
  maxValueLength: 10000,
};
