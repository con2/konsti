// Reconstructed from server/src/features/statistics/datafiles/ropecon/2021/
// rather than preserved from the live event. Some fields may be inferred
// (e.g. eventStartTime from the earliest program-item startTime) or omitted.
//
// Ropecon 2021 was a remote / COVID-era convention with direct signup only
// (no lottery), so twoPhaseSignupProgramTypes is empty.

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
  eventYear: "2021",

  // Event settings
  // No way to distribute registration codes for the remote convention
  requireRegistrationCode: false,
  assignmentAlgorithm: AssignmentAlgorithm.PADG,
  enableGroups: true,

  activeProgramTypes: [ProgramType.TABLETOP_RPG, ProgramType.LARP],

  twoPhaseSignupProgramTypes: [],

  eventStartTime: "2021-07-30T07:00:00Z", // Fri 10:00 GMT+3

  directSignupWindows: null,

  directSignupAlwaysOpenIds: [],
  addToKonstiOther: [],
  addRevolvingDoorIds: [],
  noKonstiSignupIds: [],
  signupQuestions: [],
  tournamentSignupQuestion: null,
  tournamentSignupQuestionExcludeIds: [],
};
