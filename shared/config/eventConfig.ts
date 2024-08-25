import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

// Event days
const friday = "2024-09-06";
// const saturday = "2024-09-07";
// const sunday = "2024-09-07";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.TRACON,
  eventYear: "2024",

  // Event settings
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,
  signupOpen: true,
  resultsVisible: true,
  logInvalidStartTimes: false,

  twoPhaseSignupProgramTypes: [ProgramType.FLEAMARKET],

  // Event start at 15:00 GMT+3 but lottery signups start at 08:00 GMT+3
  eventStartTime: `${friday}T05:00:00Z`, // Fri 08:00 GMT+3

  directSignupWindows: {},

  rollingSignupStartProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  hideParticipantListProgramTypes: [ProgramType.FLEAMARKET],

  // These program items have their signup always open even if signup mode is set to lottery
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
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes
  fixedLotterySignupTime: `${friday}T05:00:00Z`, // Fri 08:00 GMT+3
};
