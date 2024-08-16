import {
  ArrMin1,
  AssignmentStrategy,
  ConventionName,
  SignupStrategy,
  SignupWindow,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";

export interface EventConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  conventionName: ConventionName;
  conventionYear: string;
  conventionStartTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Partial<
    Record<ProgramType, ArrMin1<SignupWindow>>
  > | null;
  rollingSignupStartProgramTypes: ProgramType[];
  directSignupAlwaysOpenIds: string[];
  requireRegistrationCode: boolean;
  twoPhaseSignupProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonstiOther: string[];
  noKonstiSignupIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: Omit<SignupQuestion, "programItemId"> | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  isEnglishProgramItems: string[];
  logInvalidStartTimes: boolean;
}

// Convention days
const friday = "2024-09-06";
// const saturday = "2024-09-07";
// const sunday = "2024-09-07";

export const eventConfig: EventConfig = {
  // Convention info
  conventionName: ConventionName.TRACON,
  conventionYear: "2024",

  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,
  logInvalidStartTimes: false,

  twoPhaseSignupProgramTypes: [ProgramType.FLEAMARKET],

  conventionStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3

  directSignupWindows: {},

  rollingSignupStartProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [],

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
};
