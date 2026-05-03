// Reconstructed from server/src/features/statistics/datafiles/tracon-hitpoint/2019/
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
  eventName: EventName.HITPOINT,
  eventYear: "2019",

  // Event settings
  requireRegistrationCode: true,
  assignmentAlgorithm: AssignmentAlgorithm.PADG,
  enableGroups: true,

  activeProgramTypes: [ProgramType.TABLETOP_RPG],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  eventStartTime: "2019-11-23T08:00:00Z", // Sat 10:00 GMT+2

  directSignupWindows: null,

  directSignupAlwaysOpenIds: [],
  addToKonstiOther: [],
  addRevolvingDoorIds: [],
  noKonstiSignupIds: [],
  signupQuestions: [],
  tournamentSignupQuestion: null,
  tournamentSignupQuestionExcludeIds: [],
};
