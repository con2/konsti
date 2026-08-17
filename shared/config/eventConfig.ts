import {
  AssignmentAlgorithm,
  EventConfig,
  EventName,
  EventSignupStrategy,
  LoginProvider,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigTypes";
import { ProgramType, SignupType } from "shared/types/models/programItem";

// Event days
const friday = "2026-09-04";
const saturday = "2026-09-05";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.TRACON,
  eventYear: "2026",

  // Event settings
  enableRevolvingDoor: false,
  enableTagDropdown: false,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM,
  enableGroups: true,
  removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.ALL_UPCOMING,
  programGuideUrlFi: "https://tracon.fi/opas",
  programGuideUrlEn: "https://tracon.fi/opas",

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.WORKSHOP,
    ProgramType.FLEAMARKET,
  ],

  twoPhaseSignupProgramTypes: [ProgramType.FLEAMARKET],

  // Event start at 15:00 GMT+3 but lottery sign-ups start at 08:00 GMT+3
  eventStartTime: `${friday}T05:00:00Z`, // Fri 08:00 GMT+3
  preConventionWeekSignupStartTime: null,
  mainEventProgramVisibleTime: null,

  directSignupWindows: {},

  rollingDirectSignupProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.WORKSHOP,
  ],
  enableRollingDirectSignupPreviousDay: true,

  hideParticipantListProgramTypes: [ProgramType.FLEAMARKET],

  // These program items have their sign-up always open even if sign-up mode is set to lottery
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti sign-up
  noKonstiSignupIds: [],

  // Don't import these program items from Kompassi - this is program item id, not schedule item
  ignoreProgramItemsIds: [],

  signupQuestions: [],

  tournamentSignupQuestion: null,

  tournamentSignupQuestionExcludeIds: [],

  customDetailsProgramItems: {},

  // Require checkbox to be checked before signing up
  entryConditions: [],

  // Two phase sign-up settings
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes

  // Use fixed time to open all lottery sign-ups for the whole event
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

  // What sign-up type is set if sign-up type is missing
  defaultSignupType: SignupType.KONSTI,

  // Default DB values
  defaultSignupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  defaultLoginProvider: LoginProvider.KOMPASSI,
};
