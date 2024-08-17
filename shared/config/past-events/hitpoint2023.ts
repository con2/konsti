import {
  AssignmentStrategy,
  ConventionName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventConfig: Partial<EventConfig> = {
  // Convention info
  conventionName: ConventionName.HITPOINT,
  conventionYear: "2023",

  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  conventionStartTime: `2023-11-04T08:00:00Z`, // Sat 10:00 GMT+2

  directSignupWindows: null,

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [
    "p7429", // Peliä Pyynnöstä
    "p7428", // Peliä Pyynnöstä
    "p7272", // Indiepelipiste / Indie Game Point
    "p7431", // Indiepelipiste / Indie Game Point
    "p7381", // LARP-Telenovela: Häät
    "p7426", // LARP-Telenovela: Häät
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
};
