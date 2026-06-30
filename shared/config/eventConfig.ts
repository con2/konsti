import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
  EventSignupStrategy,
  LoginProvider,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigTypes";
import { ProgramType, SignupType } from "shared/types/models/programItem";
import { SignupQuestionType } from "shared/types/models/settings";

// Event days
const friday = "2026-07-24";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.ROPECON,
  eventYear: "2026",

  // Event settings
  enableRevolvingDoor: true,
  enableTagDropdown: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,

  // Remove lottery signups after assignment: overlapping signups, all upcoming signups, or none
  removeLotterySignupsStrategy: RemoveLotterySignupsStrategy.OVERLAP,

  programGuideUrl: "https://ropecon.fi/opas",

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
    ProgramType.WORKSHOP,
    ProgramType.OTHER_GAMING,
    ProgramType.OTHER,
  ],

  twoPhaseSignupProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.WORKSHOP,
    ProgramType.OTHER_GAMING,
  ],

  eventStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3
  preConventionWeekSignupStartTime: "2026-07-13T17:00:00Z", // Mon 13.7. 20:00 GMT+3
  mainEventProgramVisibleTime: "2026-07-23T17:00:00Z", // Thu 23.7. 20:00 GMT+3

  directSignupWindows: {},

  rollingDirectSignupProgramTypes: [],
  enableRollingDirectSignupPreviousDay: true,

  hideParticipantListProgramTypes: [],

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

  signupQuestions: [
    {
      programItemId: "hamarankavijat-roolipeli", // Hämäränkävijät-roolipeli – 1. pelautus (5 - 8-vuotiaille)
      questionFi: "Peliin ilmoitetun lapsen ikä",
      questionEn: "The age of the child signed up for the game",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      programItemId: "hamarankavijat-roolipeli-2", // Hämäränkävijät-roolipeli – 2. pelautus (5 - 8-vuotiaille)
      questionFi: "Peliin ilmoitetun lapsen ikä",
      questionEn: "The age of the child signed up for the game",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      programItemId: "hamarankavijat-roolipeli-3", // Hämäränkävijät-roolipeli – 3. pelautus (7 - 12-vuotiaille)
      questionFi: "Peliin ilmoitetun lapsen ikä",
      questionEn: "The age of the child signed up for the game",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
  ],

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

  // Default DB values
  defaultSignupStrategy: EventSignupStrategy.LOTTERY_AND_DIRECT,
  defaultLoginProvider: LoginProvider.LOCAL_KOMPASSI,
};
