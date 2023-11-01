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
  conventionEndTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Record<ProgramType, ArrMin1<SignupWindow>> | null;
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
  tournamentSignupQuestion: SignupQuestion | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  isEnglishProgramItems: string[];
}

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

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  conventionStartTime: `2023-11-04T08:00:00Z`, // Sat 10:00 GMT+2
  conventionEndTime: `2023-11-05T22:00:00Z`, // Sun 24:00 GMT+2

  directSignupWindows: null,

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

  isEnglishProgramItems: [
    "p7300", // In the Crowd
    "p7340", // Introduction to PBTA: Dungeon World
  ],

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
