// Reconstructed from server/src/features/statistics/datafiles/ropecon/2022/
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
  eventYear: "2022",

  // Event settings
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: true,

  activeProgramTypes: [
    ProgramType.TABLETOP_RPG,
    ProgramType.LARP,
    ProgramType.TOURNAMENT,
  ],

  twoPhaseSignupProgramTypes: [ProgramType.TABLETOP_RPG],

  eventStartTime: "2022-07-29T12:00:00Z", // Fri 15:00 GMT+3

  directSignupWindows: null,

  directSignupAlwaysOpenIds: [],
  addToKonstiOther: [],
  addRevolvingDoorIds: [],
  noKonstiSignupIds: [],
  signupQuestions: [],
  tournamentSignupQuestion: null,
  tournamentSignupQuestionExcludeIds: [],
};
