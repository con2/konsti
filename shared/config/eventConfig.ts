import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

export const eventConfig: EventConfig = {
  // Event info
  eventName: EventName.HITPOINT,
  eventYear: "2024",

  // Event settings
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  popularityAlgorithm: AssignmentAlgorithm.PADG,
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

  eventStartTime: `2024-11-02T08:00:00Z`, // Sat 10:00 GMT+2

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

  isEnglishProgramItems: [],

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
