import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { Language, ProgramType, Tag } from "shared/types/models/programItem";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.HITPOINT,
  eventYear: "2024",

  // Event settings
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,
  signupOpen: true,
  resultsVisible: true,
  logInvalidStartTimes: true,
  enableRemoveOverlapSignups: true,

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.WORKSHOP,
  ],

  twoPhaseSignupProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.WORKSHOP,
  ],

  eventStartTime: "2024-11-02T08:00:00Z", // Sat 10:00 GMT+2

  directSignupWindows: {},

  rollingDirectSignupProgramTypes: [],
  enableRollingDirectSignupPreviousDay: false,

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

  signupQuestions: [],

  tournamentSignupQuestion: null,

  tournamentSignupQuestionExcludeIds: [],

  customDetailsProgramItems: {
    // L&L Gorgoniuksen Koodeksi
    "lollo-praedor": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
    },
    // Deathmatch Island
    "deathmatch-island": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
    },
    // City of the Scorpion God
    "city-of-the-scorpion-god": {
      tags: [Tag.FOR_18_PLUS_ONLY],
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Kirottu Matka
    "kirottu-matka": {
      tags: [Tag.FOR_18_PLUS_ONLY],
    },
    // Timantin sävyvirhe
    "timantin-savyvirhe-2": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
    },
    // Offworlders: Kosmoksen karsein keikka
    "offworlders-kosmoksen-karsein-keikka": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
    },
    // Scamatania: Kaunojen kari (WWN)
    "scamatania-kaunojen-kari-wwn": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
    },
    // Kirottu Matka
    "kirottu-matka-2": {
      tags: [Tag.FOR_18_PLUS_ONLY],
    },
    // Auld Sanguine - A New Year's Eve Vampire the Masquerade Story
    "auld-sanguine": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
      languages: [Language.ENGLISH],
    },
    // Läpimurto
    lapimurto: {
      tags: [Tag.FOR_18_PLUS_ONLY],
    },
    // The Lighthouse
    "the-lighthouse": {
      tags: [Tag.FOR_18_PLUS_ONLY, Tag.BEGINNER_FRIENDLY],
      languages: [Language.ENGLISH],
    },
    // Pelipöytä ry peluuttaa: Ryuutama
    "pelipoyta-ry-peluuttaa-ryuutama": {
      tags: [Tag.CHILDREN_FRIENDLY, Tag.BEGINNER_FRIENDLY],
    },
    // Session Zero - Tavernassa tapahtuu
    "session-zero-tavernassa-tapahtuu": {
      tags: [Tag.CHILDREN_FRIENDLY, Tag.BEGINNER_FRIENDLY],
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Session Zero - Tavernassa tapahtuu
    "session-zero-tavernassa-tapahtuu-2": {
      tags: [Tag.CHILDREN_FRIENDLY, Tag.BEGINNER_FRIENDLY],
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Mates, Dates and Sleepovers
    "mates-dates-and-sleepovers": {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.ENGLISH],
    },
    // Duty Unto Death - A Dragon Age RPG
    "duty-unto-death-a-dragon-age-rpg": {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Monster
    monster: {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Pathfinder Society Scenario #6-01: Intro: Year of Immortal Influence
    "pathfinder-society-scenario-6-01-intro-year-of-immortal-influence": {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.ENGLISH],
    },
    // Red Tundra
    "red-tundra": {
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Alice is Missing
    "alice-is-missing": {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.ENGLISH],
    },
    // The Dalish Curse - A Dragon Age RPG
    "the-dalish-curse-a-dragon-age-rpg": {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.FINNISH, Language.ENGLISH],
    },
    // Pathfinder Society Scenario #6-01: Intro: Year of Immortal Influence
    "pathfinder-society-special-3-99-fate-in-the-future": {
      tags: [Tag.BEGINNER_FRIENDLY],
      languages: [Language.ENGLISH],
    },
    // Maaginen arkisto
    "maaginen-arkisto": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Song of Ice and Fire demo
    "song-of-ice-and-fire-demo": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // ECO MOFOS!! INTO THE ANTLION'S DEN
    "eco-mofos-into-the-antlions-den": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Säkäheitto livepelautus
    "sakaheitto-livepelautus": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Kuonojoen lohikäärme
    "kuonojoen-lohikaarme": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Toivottavasti kukaan ei huomaa!
    "toivottavasti-kukaan-ei-huomaa": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Tyhjyyden meren hirviöt
    "tyhjyyden-meren-hirviot": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Space 1889: Pakkolasku Venuksen viidakkoon
    "space-1889-pakkolasku-venuksen-viidakkoon": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Berserkin Pesä: Vallat ja väet
    "berserkin-pesa-vallat-ja-vaet": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Ruhtinaan aika
    "ruhtinaan-aika": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Ihmiskarjujen yö / Night of the Hogmen
    "ihmiskarjujen-yo-night-of-the-hogmen": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Mysteerien Maatila
    "mysteerien-maatila": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Waking of Willowby Hall
    "waking-of-willowby-hall": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Juokse, juokse, kultaseni
    "juokse-juokse-kultaseni": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Praedor: Kirotut kuninkaanvaalit
    "praedor-kirotut-kuninkaanvaalit": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Frendejä, kundeja ja pullonpyöritystä
    "frendeja-kundeja-ja-pullonpyoritysta": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Alien - USCSS Traconis
    "alien-uscss-traconis": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Neuvoston umpisolmu
    "neuvoston-umpisolmu": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Alavilla mailla
    "alavilla-mailla": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Toivottavasti kukaan ei huomaa!
    "toivottavasti-kukaan-ei-huomaa-2": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Vaiettu menneisyys
    "vaiettu-menneisyys": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Praedor: Kirotut kuninkaanvaalit
    "praedor-kirotut-kuninkaanvaalit-2": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Meripihkalinna
    meripihkalinna: {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Taivaskone
    taivaskone: {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Alien - USCSS Traconis
    "alien-uscss-traconis-2": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
    // Space 1889: Pakkolasku Venuksen viidakkoon
    "space-1889-pakolasku-venuksen-viidakkoon": {
      tags: [Tag.BEGINNER_FRIENDLY],
    },
  },

  // Require checkbox to be checked before signing up
  entryConditions: [],

  // Two phase signup settings
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes

  // Use fixed time to open all lottery signups for the whole event
  fixedLotterySignupTime: null,

  // If workshop doesn't have max attendees, mark it as a revolving door
  enableRevolvingDoorWorkshopsIfNoMax: false,
};
