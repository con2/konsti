import dayjs from "dayjs";
import {
  ArrMin1,
  AssignmentStrategy,
  ConventionName,
  LoginProvider,
  SignupStrategy,
  SignupWindow,
} from "shared/config/sharedConfigTypes";
import { ProgramType } from "shared/typings/models/game";
import { SignupQuestion } from "shared/typings/models/settings";

export interface SharedConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  defaultSignupStrategy: SignupStrategy;
  defaultLoginProvider: LoginProvider;
  conventionName: ConventionName;
  conventionYear: string;
  conventionStartTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Record<ProgramType, ArrMin1<SignupWindow>>;
  directSignupAlwaysOpenIds: string[];
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  requireRegistrationCode: boolean;
  activeProgramTypes: ProgramType[];
  twoPhaseSignupProgramTypes: ProgramType[];
  directSignupProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonsti: string[];
  noKonstiSignupIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: SignupQuestion | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
}

// Convention days
const saturday = "2023-11-04";
const sunday = "2023-11-05";

export const sharedConfig: SharedConfig = {
  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  defaultSignupStrategy: SignupStrategy.ALGORITHM_AND_DIRECT,
  defaultLoginProvider: LoginProvider.LOCAL,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  activeProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  directSignupProgramTypes: [
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
    ProgramType.WORKSHOP,
    ProgramType.EXPERIENCE_POINT,
    ProgramType.OTHER,
  ],

  conventionStartTime: `${saturday}T07:00:00Z`, // Sat 10:00

  directSignupWindows: {
    // @ts-expect-error: RPGs use DIRECT_SIGNUP_START
    tabletopRPG: [],

    larp: [
      {
        signupWindowStart: dayjs(`${saturday}T07:00:00Z`), // Sat 10:00
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00
      },
    ],
  },

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [],

  // These program items are hand picked to be exported from Kompassi
  addToKonsti: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [
    "p7429", // Peliä Pyynnöstä
    "p7428", // Peliä Pyynnöstä
    "p7272", // Indiepelipiste / Indie Game Point
    "p7431", // Indiepelipiste / Indie Game Point
  ],

  signupQuestions: [],

  tournamentSignupQuestion: null,

  tournamentSignupQuestionExcludeIds: [],

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  conventionName: ConventionName.HITPOINT,
  conventionYear: "2023",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,
};
