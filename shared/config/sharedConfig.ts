import dayjs from "dayjs";
import {
  ArrMin1,
  AssignmentStrategy,
  ConventionName,
  SignupStrategy,
  SignupWindow,
} from "shared/config/sharedConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import {
  SignupQuestion,
  SignupQuestionType,
} from "shared/types/models/settings";

export interface SharedConfig {
  assignmentStrategy: AssignmentStrategy;
  enableGroups: boolean;
  conventionName: ConventionName;
  conventionYear: string;
  conventionStartTime: string;
  DIRECT_SIGNUP_START: number;
  PRE_SIGNUP_START: number;
  PHASE_GAP: number;
  directSignupWindows: Partial<
    Record<ProgramType, ArrMin1<SignupWindow>>
  > | null;
  rollingSignupStartProgramTypes: ProgramType[];
  directSignupAlwaysOpenIds: string[];
  tracesSampleRate: number;
  enableSentryInDev: boolean;
  requireRegistrationCode: boolean;
  twoPhaseSignupProgramTypes: ProgramType[];
  manualSignupMode: SignupStrategy.ALGORITHM | SignupStrategy.DIRECT | "none";
  signupOpen: boolean;
  resultsVisible: boolean;
  addToKonsti: string[];
  noKonstiSignupIds: string[];
  signupQuestions: SignupQuestion[];
  tournamentSignupQuestion: Omit<SignupQuestion, "programItemId"> | null;
  tournamentSignupQuestionExcludeIds: string[];
  addRevolvingDoorIds: string[];
  isEnglishProgramItems: string[];
  maxValueLength: number;
}

// Convention days
const friday = "2024-07-19";
const saturday = "2024-07-20";
const sunday = "2024-07-21";

export const sharedConfig: SharedConfig = {
  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: true,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  conventionStartTime: `${friday}T12:00:00Z`, // Fri 15:00 GMT+3

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

  rollingSignupStartProgramTypes: [ProgramType.WORKSHOP, ProgramType.OTHER],

  // These program items have their signup always open even if signup mode is set to algorithm
  directSignupAlwaysOpenIds: [
    "pathfinder-society-4-99-blessings-of-the-forest", // Pathfinder Society #4-99 Blessings of the Forest
  ],

  // These program items are hand picked to be exported from Kompassi
  addToKonsti: [
    // Other
    "harmaasusien-taisteluharjoitukset", // Harmaasusien taisteluharjoitukset
    "atarashii-naginata-lajinaytos-ja-kokeiluharjoitukset", // Atarashii Naginata: lajinäytös ja kokeiluharjoitukset
    "kps-turnaus-rps-tournament", // KPS-turnaus / RPS Tournament
    "keppielainten-ja-keppihirvioiden-kilpailut", // Keppieläinten ja keppihirviöiden kilpailut!

    // ** ropecon2023_signuplist - no need to hand pick after Kompassi importer updated**

    // Turnaukset: muu / Tournament: Other
    "pikamaalauskilpailu-speed-painting-contest-1-pefri", // Pikamaalauskilpailu / Speed Painting Contest 1 (Pe/Fri)
    "pikamaalauskilpailu-speed-painting-contest-2-pefri", // Pikamaalauskilpailu / Speed Painting Contest 2 (Pe/Fri)
    "pikamaalauskilpailu-speed-painting-contest-3-lasat", // Pikamaalauskilpailu / Speed Painting Contest 3 (La/Sat)
    "pikamaalauskilpailu-speed-painting-contest-4-lasat", // Pikamaalauskilpailu / Speed Painting Contest 4 (La/Sat)
    "palapeliturnaus-joukkue-jigsaw-puzzle-tournament-teams", // Palapeliturnaus (Joukkue) | Jigsaw Puzzle Tournament (Teams)

    // Figupelit: demotus / Miniature wargames: Demo game
    "siniviivan-sankarit", // Siniviivan Sankarit

    // Turnaukset: lautapelit / Tournament: Board games
    "orcs-must-die-order-vs-unchained-ropecon-lopputaisteluropecon-final-fight", // Orcs Must Die! Order vs Unchained -Ropecon lopputaistelu/Ropecon Final Fight
    "ropeconin-backgammonmestari", // Ropeconin backgammonmestari

    // Turnaukset: korttipelit / Tournament: Card games
    "mtg-bulk-commander", // MtG Bulk Commander
    "clash-of-decks-turnaus", // Clash of Decks turnaus
  ],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [
    // RPG
    "charlie-ei-surffaa-pe", // Charlie ei surffaa (Pe)
    "berserkin-pesa-taalla-hirvioita-on-berserkers-nest-here-there-be-monsters-pe", // Berserkin Pesä: Täällä hirviöitä on / Berserker's Nest: Here there be monsters (Pe)
    "seikkailu-d", // seikkailu d
    "rogues-and-raiders-in-a-cursed-world-konnia-ja-kaappareita-kirotussa-maailmassa", // Rogues and Raiders in a Cursed World / Konnia ja kaappareita kirotussa maailmassa
    "indiehuone-indie-room-indierummet", // Indiehuone / Indie Room / Indierummet
    "indiehuone-indie-room-indierummet-2", // Indiehuone / Indie Room / Indierummet
    "indiehuone-indie-room-indierummet-3", // Indiehuone / Indie Room / Indierummet
    "olosuhteet-zombimaailmanloppu-pahispelautus-circumstances-zombie-apocalypse-villain-gameplay", // Olosuhteet - Zombimaailmanloppu (pahispelautus) / Circumstances – Zombie Apocalypse (villain gameplay)
    "pelimestari-fi-presents-celebrity-cruise", // Pelimestari.fi presents: Celebrity cruise
    "jatkot", // Jatkot
    "berserkin-pesa-me-hirviot-berserkers-nest-we-the-monsters-la", // Berserkin Pesä: Me hirviöt / Berserker's Nest: We the monsters (La)
    "charlie-ei-surffaa-la", // Charlie ei surffaa (La)
    "the-cosmos-is-full-of-monsters-kosmos-on-taynna-hirvioita", // The Cosmos is Full of Monsters = Kosmos on täynnä hirviöitä
    "pro-junta", // Pro-Junta
    "musta-lippu-liehumaan-fly-the-black-flag", // Musta lippu liehumaan! / Fly the black flag!
    "seikkailu-k", // seikkailu k
    "varjojen-kartano-mansion-of-shadows-2", // Varjojen kartano/ Mansion of shadows 2
    "rogues-and-raiders-in-a-cursed-world-2nd-game-konnia-ja-kaappareita-kirotussa-maailmassa-2-pelautus", // Rogues and Raiders in a Cursed World (2nd game) / Konnia ja kaappareita kirotussa maailmassa (2. pelautus)
    "kadonneiden-tornien-kolmio", // Kadonneiden tornien kolmio
    "overlord-2024-naytospeli", // Overlord 2024 näytöspeli
    "overlord-2024-naytospeli-2", // Overlord 2024 näytöspeli
    "overlord-2024-naytospeli-3", // Overlord 2024 näytöspeli
    "olosuhteet-zombimaailmanloppu-co-op-circumstances-zombie-apocalypse-co-op", // Olosuhteet - Zombimaailmanloppu (co-op) / Circumstances – Zombie Apocalypse (co-op)
    "charlie-ei-surffaa-su", // Charlie ei surffaa (Su)
    "seikkailu-r", // seikkailu r
  ],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [
    // RPG
    "charlie-ei-surffaa-pe", // Charlie ei surffaa (Pe)
    "charlie-ei-surffaa-la", // Charlie ei surffaa (La)
    "charlie-ei-surffaa-su", // Charlie ei surffaa (Su)
    "indiehuone-indie-room-indierummet", // Indiehuone / Indie Room / Indierummet
    "indiehuone-indie-room-indierummet-2", // Indiehuone / Indie Room / Indierummet
    "indiehuone-indie-room-indierummet-3", // Indiehuone / Indie Room / Indierummet

    // LARPS
    "henkien-yo", // Henkien yö
    "lauteilla-digitaalinen-ratkaisuraati", // Lauteilla – Digitaalinen ratkaisuraati
    "metsien-viimeinen-huuto-the-last-cry-of-the-forest-1-pelautus1-run", // Metsien viimeinen huuto / The last cry of the forest, 1. pelautus/1. run
    "the-last-cry-of-the-forest-metsien-viimeinen-huuto-2-run2-pelautus", // The last cry of the forest / Metsien viimeinen huuto, 2. run/2. pelautus
    "revontulten-taikaa-1-pelautus", // Revontulten taikaa, 1. pelautus
    "revontulten-taikaa-2-pelautus", // Revontulten taikaa, 2. pelautus
    "revontulten-taikaa-3-pelautus", // Revontulten taikaa, 3. pelautus
    "revontulten-taikaa-4-pelautus", // Revontulten taikaa, 4. pelautus
    "vaeltajien-tarina", // Vaeltajien tarina
    "sangyn-allaunder-your-bed-escape-1-pelautus1-run", // Sängyn Alla/Under Your Bed escape, 1. pelautus/1. run
    "sangyn-allaunder-your-bed-escape-2-pelautus2-run", // Sängyn Alla/Under Your Bed escape, 2. pelautus/2. run
    "sangyn-allaunder-your-bed-escape-3-pelautus3-run", // Sängyn Alla/Under Your Bed escape, 3. pelautus/3. run
    "sangyn-allaunder-your-bed-escape-4-pelautus4-run", // Sängyn Alla/Under Your Bed escape, 4. pelautus/4. run
  ],

  signupQuestions: [
    {
      programItemId: "pathfinder-society-4-99-blessings-of-the-forest", // Pathfinder Society #4-99 Blessings of the Forest
      questionFi:
        "Hahmoluokka ja taso. Jos sinulla on useampi hahmo, merkitse ensisijainen hahmo sulkeilla.",
      questionEn:
        "Character class and level. If you have multiple characters, mark primary character with brackets.",
      private: false,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      programItemId: "palapeliturnaus-joukkue-jigsaw-puzzle-tournament-teams", // Palapeliturnaus (Joukkue) | Jigsaw Puzzle Tournament (Teams)
      questionFi:
        "Syötä joukkueen nimi, kaikkien joukkueesi jäsenten (2-4 kpl) nimet, sekä ainakin yhden jäsenen sähköpostiosoite ja puhelinnumero mahdollista palkintoyhteydenottoa varten.",
      questionEn:
        "Please write the name of your team, the names of all team members (2-4 people) and an email address and phone number of at least one team member in case we need to contact you about a possible award.",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
    },
    {
      programItemId: "pikamaalauskilpailu-speed-painting-contest-1-pefri", // Pikamaalauskilpailu / Speed Painting Contest 1 (Pe/Fri)
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
      programItemId: "pikamaalauskilpailu-speed-painting-contest-2-pefri", // Pikamaalauskilpailu / Speed Painting Contest 2 (Pe/Fri)
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
      programItemId: "pikamaalauskilpailu-speed-painting-contest-3-lasat", // Pikamaalauskilpailu / Speed Painting Contest 3 (La/Sat)
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
      programItemId: "pikamaalauskilpailu-speed-painting-contest-4-lasat", // Pikamaalauskilpailu / Speed Painting Contest 4 (La/Sat)
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
    "palapeliturnaus-joukkue-jigsaw-puzzle-tournament-teams",
    "pikamaalauskilpailu-speed-painting-contest-1-pefri",
    "pikamaalauskilpailu-speed-painting-contest-2-pefri",
    "pikamaalauskilpailu-speed-painting-contest-3-lasat",
    "pikamaalauskilpailu-speed-painting-contest-4-lasat",
  ],

  isEnglishProgramItems: [],

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes

  // Convention info
  conventionName: ConventionName.ROPECON,
  conventionYear: "2024",

  // Sentry
  tracesSampleRate: 0.0,
  enableSentryInDev: false,
  maxValueLength: 100000,
};
