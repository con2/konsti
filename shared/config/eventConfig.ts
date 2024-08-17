import {
  AssignmentStrategy,
  ConventionName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

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

  conventionStartTime: `${friday}T05:00:00Z`, // Fri 08:00 GMT+3

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
