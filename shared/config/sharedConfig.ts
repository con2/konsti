import dayjs, { Dayjs } from "dayjs";
import {
  ArrMin1,
  AssignmentStrategy,
  ConventionName,
  SignupStrategy,
} from "shared/config/sharedConfigTypes";
import { ProgramType } from "shared/types/models/game";
import { SignupQuestion } from "shared/types/models/settings";

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
  tournamentSignupQuestion: SignupQuestion | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  isEnglishProgramItems: string[];
}

export const sharedConfig: SharedConfig = {
  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: false,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  twoPhaseSignupProgramTypes: [],

  conventionStartTime: `2024-04-11T07:00:00Z`, // Thu 10:00 GMT+3

  directSignupStartTimes: {
    larp: [
      dayjs(`2024-04-04T10:00:00Z`), // One week before, Thu 13:00 GMT+3
    ],
    tournament: [
      dayjs(`2024-04-04T10:00:00Z`), // One week before, Thu 13:00 GMT+3
    ],
    roundtableDiscussion: [
      dayjs(`2024-04-04T10:00:00Z`), // One week before, Thu 13:00 GMT+3
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

  tournamentSignupQuestion: null,

  tournamentSignupQuestionExcludeIds: [],

  isEnglishProgramItems: [],

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  conventionName: ConventionName.SOLMUKOHTA,
  conventionYear: "2024",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,
};
