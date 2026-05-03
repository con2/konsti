// Reconstructed from server/src/features/statistics/datafiles/ropecon/2017/
// rather than preserved from the live event. Some fields may be inferred
// (e.g. eventStartTime from the earliest program-item startTime) or omitted.

import {
  AssignmentAlgorithm,
  EventName,
  EventConfig,
} from "shared/config/eventConfigTypes";
import { ProgramType } from "shared/types/models/programItem";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventConfig: Partial<EventConfig> = {
  // Event info
  eventName: EventName.ROPECON,
  eventYear: "2017",

  // Event settings
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.PADG,
  enableGroups: false,

  activeProgramTypes: [ProgramType.TABLETOP_RPG],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  eventStartTime: "2017-07-28T12:00:00Z", // Fri 15:00 GMT+3

  directSignupWindows: null,

  directSignupAlwaysOpenIds: [],
  addToKonstiOther: [],
  addRevolvingDoorIds: [],
  noKonstiSignupIds: [],
  signupQuestions: [],
  tournamentSignupQuestion: null,
  tournamentSignupQuestionExcludeIds: [],
};
