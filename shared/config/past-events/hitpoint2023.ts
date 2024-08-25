import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventConfig: Partial<EventConfig> = {
  // Event info
  eventName: EventName.HITPOINT,
  eventYear: "2023",

  // Event settings
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,
  signupOpen: true,
  resultsVisible: true,

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  eventStartTime: `2023-11-04T08:00:00Z`, // Sat 10:00 GMT+2

  directSignupWindows: null,

  // These program items have their signup always open even if signup mode is set to lottery
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
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes
};
