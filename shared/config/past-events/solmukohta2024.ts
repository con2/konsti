import {
  AssignmentAlgorithm,
  EventConfig,
  EventName,
  EventSignupStrategy,
  LoginProvider,
} from "shared/config/eventConfigTypes";

export const eventConfig: Partial<EventConfig> = {
  // Event info
  eventName: EventName.SOLMUKOHTA,
  eventYear: "2024",

  // Event settings
  assignmentAlgorithm: AssignmentAlgorithm.RANDOM_PADG,
  enableGroups: false,

  twoPhaseSignupProgramTypes: [],

  eventStartTime: "2024-04-11T07:00:00Z", // Thu 10:00 GMT+3

  directSignupWindows: {
    larp: [
      {
        signupWindowStart: "2024-04-04T17:00:00Z", // One week before, Thu 20:00 GMT+3
        signupWindowClose: "2024-04-14T21:00:00Z", // Event end, Sun 24:00 GMT+3
      },
    ],
    workshop: [
      {
        signupWindowStart: "2024-04-04T17:00:00Z", // One week before, Thu 20:00 GMT+3
        signupWindowClose: "2024-04-14T21:00:00Z", // Event end, Sun 24:00 GMT+3
      },
    ],
    roundtableDiscussion: [
      {
        signupWindowStart: "2024-04-04T17:00:00Z", // One week before, Thu 20:00 GMT+3
        signupWindowClose: "2024-04-14T21:00:00Z", // Event end, Sun 24:00 GMT+3
      },
    ],
  },

  // These program items have their sign-up always open even if sign-up mode is set to lottery
  directSignupAlwaysOpenIds: [],

  // Add these to Konsti under 'other' program type
  addToKonstiOther: [],

  // These program items have hand picked revolving door status
  addRevolvingDoorIds: [],

  // These program items are imported to Konsti but don't have Konsti sign-up
  noKonstiSignupIds: [],

  signupQuestions: [],

  tournamentSignupQuestion: null,

  tournamentSignupQuestionExcludeIds: [],

  // Two phase sign-up settings
  preSignupStart: 60 * 4, // minutes
  directSignupPhaseStart: 60 * 2, // minutes
  phaseGap: 15, // minutes

  // Default DB values
  defaultSignupStrategy: EventSignupStrategy.DIRECT,
  defaultLoginProvider: LoginProvider.KOMPASSI,
};
