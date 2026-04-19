import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType, SignupType } from "shared/types/models/programItem";

// Event days
const friday = "2026-07-24";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.ROPECON,
  eventYear: "2026",

  // Event settings
  enableRevolvingDoor: true,
  enableTagDropdown: true,

  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,
  signupOpen: true, // TODO: Remove this
  resultsVisible: true, // TODO: Remove this

  // Remove overlapping lottery signups...
  enableRemoveOverlapSignups: false,
  // ... or remove all upcoming lottery signups
  enableRemoveAllUpcomingSignups: true,

  programGuideUrl: "https://2025.ropecon.fi/opas",

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
    ProgramType.WORKSHOP,
    ProgramType.OTHER,
  ],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.WORKSHOP],

  eventStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3

  directSignupWindows: {},

  rollingDirectSignupProgramTypes: [],
  enableRollingDirectSignupPreviousDay: true,

  hideParticipantListProgramTypes: [],

  // Direct signup open till program item endTime instead of startTime
  directSignupOpenToEndProgramTypes: [], // TODO: Remove config

  // These program items have their signup always open even if signup mode is set to lottery
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [],

  // Don't import these program items from Kompassi - this is program item id, not schedule item
  ignoreProgramItemsIds: [],

  signupQuestions: [],

  tournamentSignupQuestion: null,

  tournamentSignupQuestionExcludeIds: [],

  customDetailsProgramItems: {},

  // Require checkbox to be checked before signing up
  entryConditions: [],

  // Two phase signup settings
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes

  // Use fixed time to open all lottery signups for the whole event
  fixedLotterySignupTime: null,

  // Program items with parentId use startTime configured here
  startTimesByParentIds: new Map(),

  defaultSignupType: SignupType.KONSTI,
};
