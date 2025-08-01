import dayjs from "dayjs";
import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import { SignupQuestionType } from "shared/types/models/settings";

// Event days
const friday = "2025-07-25";
const saturday = "2025-07-26";
const sunday = "2025-07-27";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.ROPECON,
  eventYear: "2025",

  // Event settings
  enableRevolvingDoor: true,
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,
  signupOpen: true,
  resultsVisible: true,
  enableRemoveOverlapSignups: true,
  programGuideUrl: "https://ropecon.fi/opas",

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.WORKSHOP,
    ProgramType.TOURNAMENT,
    ProgramType.OTHER,
  ],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.WORKSHOP],

  eventStartTime: "2025-07-25T12:00:00Z", // Fri 15:00 GMT+3

  directSignupWindows: {
    larp: [
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00 GMT+3
      },
      // Saturday morning / day
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
        signupWindowClose: dayjs(`${saturday}T14:00:00Z`), // Sat 17:00 GMT+3
      },
      // Saturday evening
      {
        signupWindowStart: dayjs(`${saturday}T08:00:00Z`), // Sat 11:00 GMT+3
        signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00 GMT+3
      },
      // Sunday
      {
        signupWindowStart: dayjs(`${saturday}T12:00:00Z`), // Sat 15:00 GMT+3
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
      },
    ],

    tournament: [
      // Friday
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00 GMT+3
      },
      // Saturday
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
        signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00 GMT+3
      },
      // Sunday
      {
        signupWindowStart: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
      },
    ],
  },

  rollingDirectSignupProgramTypes: [ProgramType.OTHER],
  enableRollingDirectSignupPreviousDay: true,

  hideParticipantListProgramTypes: [],

  // Direct signup open till program item endTime instead of startTime
  directSignupOpenToEndProgramTypes: [],

  // These program items have their signup always open even if signup mode is set to lottery
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [],

  // Don't import these program items from Kompassi - this is program item id, not schedule item
  ignoreProgramItemsIds: [
    "designkilpailu",
    "kielomatkat-fuengirola-kielo-tours-fuengirola",
    "nerdic-open-mic-kolmas-kerta-toden-sanoo",
    "viikon-hirvio",
    "maailma-myrskyn-jalkeen",
  ],

  signupQuestions: [
    {
      programItemId: "pikamaalauskilpailu-speed-painting-contest",
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
      ],
    },
    {
      programItemId: "pikamaalauskilpailu-speed-painting-contest-2",
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
      ],
    },
    {
      programItemId: "pikamaalauskilpailu-speed-painting-contest-3",
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
      ],
    },
    {
      programItemId: "pikamaalauskilpailu-speed-painting-contest-4",
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
      ],
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
};
