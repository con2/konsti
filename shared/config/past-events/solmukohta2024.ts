import dayjs from "dayjs";
import {
  AssignmentStrategy,
  ConventionName,
  EventConfig,
} from "shared/config/eventConfigTypes";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventConfig: Partial<EventConfig> = {
  // Convention info
  conventionName: ConventionName.SOLMUKOHTA,
  conventionYear: "2024",

  // Convention settings
  requireRegistrationCode: true,
  assignmentStrategy: AssignmentStrategy.RANDOM_PADG,
  enableGroups: false,
  manualSignupMode: "none",
  signupOpen: true,
  resultsVisible: true,

  twoPhaseSignupProgramTypes: [],

  conventionStartTime: `2024-04-11T07:00:00Z`, // Thu 10:00 GMT+3

  directSignupWindows: {
    larp: [
      {
        signupWindowStart: dayjs(`2024-04-04T17:00:00Z`), // One week before, Thu 20:00 GMT+3
        signupWindowClose: dayjs("2024-04-14T21:00:00Z"), // Convention end, Sun 24:00 GMT+3
      },
    ],
    workshop: [
      {
        signupWindowStart: dayjs(`2024-04-04T17:00:00Z`), // One week before, Thu 20:00 GMT+3
        signupWindowClose: dayjs("2024-04-14T21:00:00Z"), // Convention end, Sun 24:00 GMT+3
      },
    ],
    roundtableDiscussion: [
      {
        signupWindowStart: dayjs(`2024-04-04T17:00:00Z`), // One week before, Thu 20:00 GMT+3
        signupWindowClose: dayjs("2024-04-14T21:00:00Z"), // Convention end, Sun 24:00 GMT+3
      },
    ],
  },

  // These program items have their signup always open even if signup mode is set to algorithm
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

  // Two phase signup settings
  PRE_SIGNUP_START: 60 * 4, // minutes
  DIRECT_SIGNUP_START: 60 * 2, // minutes
  PHASE_GAP: 15, // minutes
};
