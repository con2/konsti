import dayjs from "dayjs";
import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import { SignupQuestionType } from "shared/types/models/settings";

// Event days
const friday = "2023-07-28";
const saturday = "2023-07-29";
const sunday = "2023-07-30";

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

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  eventStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3

  directSignupWindows: {
    larp: [
      // Friday
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00 GMT+3
      },
      // Saturday morning / day
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
        signupWindowClose: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
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

    workshop: [
      // Friday
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
        signupWindowClose: dayjs(`${friday}T21:00:00Z`), // Fri 24:00 GMT+3
      },
      // Saturday morning / day
      {
        signupWindowStart: dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
        signupWindowClose: dayjs(`${saturday}T11:00:00Z`), // Sat 14:00 GMT+3
      },
      // Saturday day / evening
      {
        signupWindowStart: dayjs(`${saturday}T06:00:00Z`), // Sat 09:00 GMT+3
        signupWindowClose: dayjs(`${saturday}T21:00:00Z`), // Sat 24:00 GMT+3
      },
      // Saturday evening / sunday morning
      {
        signupWindowStart: dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
        signupWindowClose: dayjs(`${sunday}T11:00:00Z`), // Sun 14:00 GMT+3
      },
      // Sunday
      {
        signupWindowStart: dayjs(`${sunday}T06:00:00Z`), // Sun 09:00 GMT+3
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
      },
    ],

    experiencePoint: [
      // Whole event Fri - Sun
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
      },
    ],

    other: [
      // Whole event Fri - Sun
      {
        signupWindowStart: dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
        signupWindowClose: dayjs(`${sunday}T21:00:00Z`), // Sun 24:00 GMT+3
      },
    ],
  },

  // These program items have their signup always open even if signup mode is set to lottery
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [
    "p6787", // KPS-turnaus
    "p6500", // "\"Joo ja...\" -improtunti",
  ],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [
    "p6645", // Ihmissusipeli (Werewolfes of Millers Hollow)
    "p7042", // Ihmissusipeli (Werewolfes of Millers Hollow)
    "p7043", // Ihmissusipeli (Werewolfes of Millers Hollow)
  ],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [
    "p6512", // RPG: Charlie ei surffaa - Fri
    "p7023", // RPG: Charlie ei surffaa - Sat
    "p7024", // RPG: Charlie ei surffaa - Sun
    "p7030", // RPG: Indiehuone / Indie Room / Indierummet (Pe/Fr/Fri)
    "p7029", // RPG: Indiehuone / Indie Room / Indierummet (La/Lö/Sat)
    "p7032", // RPG: Kokeile pelinjohtamista -piste (Pe)
    "p7031", // RPG: Kokeile pelinjohtamista -piste (La)
    "p6848", // Larp: Johtajakoulutus
    "p6638", // Larp: Kielokoti 1. Pelautus
    "p6999", // Larp: Kielokoti 2. Pelautus
    "p6299", // Larp: Vaeltajalegendat: Sinustako seikkailija!? 1. Pelautus
    "p7006", // Larp: Vaeltajalegendat: Sinustako seikkailija!? 2. Pelautus,
    "p6500", // Other: "\"Joo ja...\" -improtunti",
  ],

  signupQuestions: [
    {
      programItemId: "p6673", // PFS multi-table special: Pathfinder Society #3-98: Expedition into Pallid Peril
      questionFi:
        "Hahmoluokka ja taso. Jos sinulla on useampi hahmo, merkitse ensisijainen hahmo sulkeilla.",
      questionEn:
        "Character class and level. If you have multiple characters, mark primary character with brackets.",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      programItemId: "p6852", // Palapeliturnaus (Joukkue) | Jigsaw Puzzle Tournament (Teams)
      questionFi:
        "Syötä joukkueen nimi, kaikkien joukkueesi jäsenten (2-4 kpl) nimet, sekä ainakin yhden jäsenen sähköpostiosoite ja puhelinnumero mahdollista palkintoyhteydenottoa varten.",
      questionEn:
        "Please write the name of your team, the names of all team members (2-4 people) and an email address and phone number of at least one team member in case we need to contact you about a possible award.",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      programItemId: "p6639", // Pikamaalauskilpailu / Speed Painting Contest 1 (Pe/Fri)
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
        { optionFi: "Zenitaali", optionEn: "Zenithal" },
      ],
    },
    {
      programItemId: "p6978", // Pikamaalauskilpailu / Speed Painting Contest 2 (Pe/Fri)
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
        { optionFi: "Zenitaali", optionEn: "Zenithal" },
      ],
    },
    {
      programItemId: "p6989", // Pikamaalauskilpailu / Speed Painting Contest 3 (La/Sat)
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
        { optionFi: "Zenitaali", optionEn: "Zenithal" },
      ],
    },
    {
      programItemId: "p6990", // Pikamaalauskilpailu / Speed Painting Contest 4 (La/Sat)
      questionFi: "Haluan, että maalattavan figuni pohjaväri on",
      questionEn: "I want my miniature to be primed",
      private: false,
      type: SignupQuestionType.SELECT,
      selectOptions: [
        { optionFi: "Musta", optionEn: "Black" },
        { optionFi: "Valkoinen", optionEn: "White" },
        { optionFi: "Zenitaali", optionEn: "Zenithal" },
      ],
    },
  ],

  tournamentSignupQuestion: {
    questionFi:
      "Syötä nimesi, sähköpostiosoitteesi ja puhelinnumerosi mahdollista palkintoyhteydenottoa varten.",
    questionEn:
      "Please write your name, email address and phone number in case we need to contact you about a possible award.",
    private: true,
    type: SignupQuestionType.TEXT,
    selectOptions: [],
  },

  tournamentSignupQuestionExcludeIds: [
    "p6852", // Palapeliturnaus (Joukkue) | Jigsaw Puzzle Tournament (Teams)
    "p6639", // Pikamaalauskilpailu / Speed Painting Contest 1 (Pe/Fri)
    "p6978", // Pikamaalauskilpailu / Speed Painting Contest 2 (Pe/Fri)
    "p6989", // Pikamaalauskilpailu / Speed Painting Contest 3 (La/Sat)
    "p6990", // Pikamaalauskilpailu / Speed Painting Contest 4 (La/Sat)
  ],

  // Two phase signup settings
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes
};
