import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType, SignupType } from "shared/types/models/programItem";

// Event days
const friday = "2025-09-05";
const saturday = "2025-09-06";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.TRACON,
  eventYear: "2025",

  // Event settings
  enableRevolvingDoor: false,
  enableOrganizerFeedback: true,
  enableTagDropdown: false,

  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,
  signupOpen: true, // TODO: Remove this
  resultsVisible: true, // TODO: Remove this
  enableRemoveOverlapSignups: false,

  programGuideUrl: "https://2025.tracon.fi/opas",

  activeProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.FLEAMARKET],

  twoPhaseSignupProgramTypes: [ProgramType.FLEAMARKET],

  // Event start at 15:00 GMT+3 but lottery signups start at 08:00 GMT+3
  eventStartTime: `${friday}T05:00:00Z`, // Fri 08:00 GMT+3

  directSignupWindows: {},

  rollingDirectSignupProgramTypes: [ProgramType.TABLETOP_RPG],
  enableRollingDirectSignupPreviousDay: true,

  hideParticipantListProgramTypes: [ProgramType.FLEAMARKET],

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
  fixedLotterySignupTime: `${friday}T05:00:00Z`, // Fri 08:00 GMT+3

  // Program items with parentId use startTime configured here
  startTimesByParentIds: new Map([
    [
      "kirpputori-perjantai-alkuilta",
      `${friday}T13:00:00Z`, // Fri 16:00 GMT+3
    ],
    [
      "kirpputori-perjantai-loppuilta",
      `${friday}T16:00:00Z`, // Fri 19:00 GMT+3
    ],
    [
      "kirpputori-lauantai",
      `${saturday}T06:30:00Z`, // Sat 09:30 GMT+3
    ],
  ]),

  defaultSignupType: SignupType.KONSTI,
};
