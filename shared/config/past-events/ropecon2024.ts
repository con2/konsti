import dayjs from "dayjs";
import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";
import { SignupQuestionType } from "shared/types/models/settings";

// Event days
const friday = "2024-07-19";
const saturday = "2024-07-20";
const sunday = "2024-07-21";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventConfig: Partial<EventConfig> = {
  // Event info
  eventName: EventName.ROPECON,
  eventYear: "2024",

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

  rollingDirectSignupProgramTypes: [ProgramType.WORKSHOP, ProgramType.OTHER],

  // These program items have their signup always open even if signup mode is set to lottery
  directSignupAlwaysOpenIds: [
    "pathfinder-society-4-99-blessings-of-the-forest", // Pathfinder Society #4-99 Blessings of the Forest
  ],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [
    // Other
    "harmaasusien-taisteluharjoitukset", // Harmaasusien taisteluharjoitukset
    "atarashii-naginata-lajinaytos-ja-kokeiluharjoitukset", // Atarashii Naginata: lajinäytös ja kokeiluharjoitukset
    "kps-turnaus-rps-tournament", // KPS-turnaus / RPS Tournament
    "keppielainten-ja-keppihirvioiden-kilpailut", // Keppieläinten ja keppihirviöiden kilpailut!

    // Meetup
    "looking-for-geek-friends-norttiystavia-etsimassa", // Looking for Geek Friends | Nörttiystäviä etsimässä
  ],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti signup
  noKonstiSignupIds: [
    // RPG
    "charlie-ei-surffaa-pe", // Charlie ei surffaa (Pe)
    "charlie-ei-surffaa-la", // Charlie ei surffaa (La)
    "charlie-ei-surffaa-su", // Charlie ei surffaa (Su)
    "indiehuone-indie-room-indierummet", // Indiehuone / Indie Room / Indierummet
    "indiehuone-indie-room-indierummet-2", // Indiehuone / Indie Room / Indierummet
    "indiehuone-indie-room-indierummet-3", // Indiehuone / Indie Room / Indierummet
    "torchbearer", // Torchbearer RPG: Puhdistuksen labyrintti - Labyrinth of absolution
    "kokeile-pelinjohtamista-pe", // Kokeile pelinjohtamista pe
    "kokeile-pelinjohtamista-piste-2", // 'Kokeile pelinjohtamista -piste la'
    "kokeile-pelinjohtamista", // Kokeile pelinjohtamista (su)

    // LARPS
    "henkien-yo", // Henkien yö
    "lauteilla-digitaalinen-ratkaisuraati", // Lauteilla – Digitaalinen ratkaisuraati
    "lauteilla-digitaalinen-ratkaisuraati-paatostapaaminen", // Lauteilla – Digitaalinen ratkaisuraati: Päätöstapaaminen
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
    "sangyn-allaunder-your-bed-escape-5-pelautus5-run", // Sängyn Alla/Under Your Bed escape, 5. pelautus/5. run
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
    {
      programItemId: "kirjeita-pohjolassa", // Kirjeitä Pohjolassa
      questionFi: "Puheliunnumerosi",
      questionEn: "Your phone number",
      private: true,
      type: SignupQuestionType.TEXT,
      selectOptions: [],
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

  // Two phase signup settings
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes
};
