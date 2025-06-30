import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.ROPECON,
  eventYear: "2025",

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
    ProgramType.TOURNAMENT,
    ProgramType.OTHER,
  ],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.WORKSHOP],

  eventStartTime: "2025-07-25T12:00:00Z", // Fri 15:00 GMT+3

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

  // Don't import these program items from Kompassi
  ignoreProgramItemsIds: [
    "tow-miniatyyri-turnaus",
    "memories-of-necromunda-narrative-mini-campaign",
    "indiekulma-indie-corner-turnip28",
    "indiekulma-indie-corner-necropolis",
    "indiekulma-indie-corner-gaslands",
    "nopat-ja-taktiikka-demottaa-battlefleet-gothic-2",
    "nopat-ja-taktiikka-demottaa-battlefleet-gothic-3",
    "kill-team-kulma-kill-team-corner-su",
    "kill-team-kulma-kill-team-corner-la",
    "figumaalauskisa-cold-north-open-miniature-painting-competition-cold-north-open-la",
    "figumaalauskisa-cold-north-open-miniature-painting-competition-cold-north-open-3",
    "a-perfect-rock",
    "wiki-articles-are-wizards",
    "30-minuuttia-avaruusmurmelina",
    "avaruusmatka-oudot-uudet-maailmat",
    "legendary-marvel",
    "lorcana-tcg-learn-to-play-demo-01",
    "lorcana-tcg-learn-to-play-demo-02",
    "luolailua-pyynnosta-dungeoneering-on-demand",
    "tahtiin-kirjoitettu-1",
    "nim-challenge-1",
    "red-dragon-inn-saturday",
    "red-dragon-inn-saturday-2",
    "red-dragon-inn-sunday",
    "ihmissusipeli-werewolfes-of-millers-hollow-1",
    "the-werewolfes-of-millers-hollow-3",
    "netrunner-demopoyta-netrunner-demotable",
    "luolailua-pyynnosta-dungeoneering-on-demand-1",
    "luolailua-pyynnosta-dungeoneering-on-demand-2",
    "luolailua-pyynnosta-dungeoneering-on-demand-3",
    "bomb-away-helppo-hauska-ja-sopivan-kaoottinen-korttipeli-2-6-pelaajalle-fien-01",
    "bomb-away-helppo-hauska-ja-sopivan-kaoottinen-korttipeli-2-6-pelaajalle-fien-02",
    "alter-egon-lautapeleja-pyynnosta-alter-egos-board-games-on-request-01",
    "alter-egon-lautapeleja-pyynnosta-alter-egos-board-games-on-request-02",
    "alien-seikkailu-uudessa-maailmassa",
    // These have invalid start time (half past) and should be fixed
    "dnd-tai-vahan-sinnepaindnd-or-something-like-that",
  ],

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

  // If workshop doesn't have max attendees, mark it as a revolving door
  enableRevolvingDoorWorkshopsIfNoMax: false,
};
