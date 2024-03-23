import dayjs, { Dayjs } from "dayjs";
import {
  ArrMin1,
  AssignmentStrategy,
  ConventionName,
  LoginProvider,
  SignupStrategy,
} from "shared/config/sharedConfigTypes";
import { ProgramType } from "shared/types/models/game";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";

interface SharedConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  defaultSignupStrategy: SignupStrategy;
  defaultLoginProvider: LoginProvider;
  conventionName: ConventionName;
  conventionYear: string;
  conventionStartTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupStartTimes: Partial<Record<ProgramType, ArrMin1<Dayjs>>> | null;
  directSignupAlwaysOpenIds: string[];
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  requireRegistrationCode: boolean;
  activeProgramTypes: ProgramType[];
  twoPhaseSignupProgramTypes: ProgramType[];
  directSignupProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonsti: string[];
  noKonstiSignupIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: SignupQuestion | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
}

// Convention days
const friday = "2023-07-28";
const saturday = "2023-07-29";
const sunday = "2023-07-30";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sharedConfig: SharedConfig = {
  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  defaultSignupStrategy: SignupStrategy.ALGORITHM_AND_DIRECT,
  defaultLoginProvider: LoginProvider.LOCAL,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
    ProgramType.WORKSHOP,
    ProgramType.EXPERIENCE_POINT,
    ProgramType.OTHER,
  ],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  directSignupProgramTypes: [
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
    ProgramType.WORKSHOP,
    ProgramType.EXPERIENCE_POINT,
    ProgramType.OTHER,
  ],

  conventionStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3

  directSignupStartTimes: {
    larp: [
      // Friday
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3

      // Saturday morning / day
      dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3

      // Saturday evening
      dayjs(`${saturday}T08:00:00Z`), // Sat 11:00 GMT+3

      // Sunday
      dayjs(`${saturday}T12:00:00Z`), // Sat 15:00 GMT+3
    ],

    tournament: [
      // Friday
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3

      // Saturday
      dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
      // Sunday
      dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3
    ],

    workshop: [
      // Friday
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
      // Saturday morning / day
      dayjs(`${friday}T15:00:00Z`), // Fri 18:00 GMT+3
      // Saturday day / evening
      dayjs(`${saturday}T06:00:00Z`), // Sat 09:00 GMT+3
      // Saturday evening / sunday morning
      dayjs(`${saturday}T15:00:00Z`), // Sat 18:00 GMT+3

      // Sunday
      dayjs(`${sunday}T06:00:00Z`), // Sun 09:00 GMT+3
    ],

    experiencePoint: [
      // Whole convention Fri - Sun
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
    ],

    other: [
      // Whole convention Fri - Sun
      dayjs(`${friday}T12:00:00Z`), // Fri 15:00 GMT+3
    ],
  },

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [],

  // These program items are hand picked to be exported from Kompassi
  addToKonsti: [
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
      gameId: "p6673", // PFS multi-table special: Pathfinder Society #3-98: Expedition into Pallid Peril
      questionFi:
        "Hahmoluokka ja taso. Jos sinulla on useampi hahmo, merkitse ensisijainen hahmo sulkeilla.",
      questionEn:
        "Character class and level. If you have multiple characters, mark primary character with brackets.",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      gameId: "p6852", // Palapeliturnaus (Joukkue) | Jigsaw Puzzle Tournament (Teams)
      questionFi:
        "Syötä joukkueen nimi, kaikkien joukkueesi jäsenten (2-4 kpl) nimet, sekä ainakin yhden jäsenen sähköpostiosoite ja puhelinnumero mahdollista palkintoyhteydenottoa varten.",
      questionEn:
        "Please write the name of your team, the names of all team members (2-4 people) and an email address and phone number of at least one team member in case we need to contact you about a possible award.",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      gameId: "p6639", // Pikamaalauskilpailu / Speed Painting Contest 1 (Pe/Fri)
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
      gameId: "p6978", // Pikamaalauskilpailu / Speed Painting Contest 2 (Pe/Fri)
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
      gameId: "p6989", // Pikamaalauskilpailu / Speed Painting Contest 3 (La/Sat)
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
      gameId: "p6990", // Pikamaalauskilpailu / Speed Painting Contest 4 (La/Sat)
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
    gameId: "", // Filled later
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
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  conventionName: ConventionName.HITPOINT,
  conventionYear: "2023",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,
};
