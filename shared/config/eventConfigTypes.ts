import { z } from "zod";
import {
  AssignmentAlgorithm,
  EntryConditionText,
  EventName,
  EventSignupStrategy,
  LoginProvider,
  RemoveLotterySignupsStrategy,
} from "shared/config/eventConfigEnums";
import {
  AgeGroup,
  Language,
  ProgramType,
  SignupType,
  Tag,
} from "shared/types/models/programItem";
import { SignupQuestionSchema } from "shared/types/models/settings";

// Re-exported so the config's enums and its shape stay one import away
export {
  AssignmentAlgorithm,
  EntryConditionText,
  EventName,
  EventSignupStrategy,
  LoginProvider,
  RemoveLotterySignupsStrategy,
};

const SignupWindowSchema = z.object({
  signupWindowStart: z.iso.datetime(),
  signupWindowClose: z.iso.datetime(),
});

// The config's shape is declared here once and the type inferred from it, so a
// field cannot be added to one and forgotten in the other. Times are declared as
// ISO datetimes rather than plain strings: they are hand-written, nothing else
// validates them, and the formatters throw on a time they cannot parse.
export const EventConfigSchema = z.object({
  assignmentAlgorithm: z.enum(AssignmentAlgorithm),
  enableGroups: z.boolean(),
  eventName: z.enum(EventName),
  eventYear: z.string(),
  eventStartTime: z.iso.datetime(),
  preConventionWeekSignupStartTime: z.iso.datetime().nullable(),
  mainEventProgramVisibleTime: z.iso.datetime().nullable(),
  directSignupPhaseStart: z.number(),
  preSignupStart: z.number(),
  phaseGap: z.number(),
  // A tuple with a rest element rather than an array: a program type listed here
  // has to have at least one window
  directSignupWindows: z
    .partialRecord(
      z.enum(ProgramType),
      z.tuple([SignupWindowSchema]).rest(SignupWindowSchema),
    )
    .nullable(),
  rollingDirectSignupProgramTypes: z.array(z.enum(ProgramType)),
  enableRollingDirectSignupPreviousDay: z.boolean(),
  // Rolling direct sign-up does not open before this. The event start it is
  // otherwise clamped to can be much earlier, since the lottery opens from that.
  rollingDirectSignupEarliestStartTime: z.iso.datetime().nullable(),
  directSignupAlwaysOpenIds: z.array(z.string()),
  twoPhaseSignupProgramTypes: z.array(z.enum(ProgramType)),
  addToKonstiOther: z.array(z.string()),
  noKonstiSignupIds: z.array(z.string()),
  ignoreProgramItemsIds: z.array(z.string()),
  signupQuestions: z.array(SignupQuestionSchema),
  tournamentSignupQuestion: SignupQuestionSchema.omit({
    programItemId: true,
  }).nullable(),
  tournamentSignupQuestionExcludeIds: z.array(z.string()),
  addRevolvingDoorIds: z.array(z.string()),
  hideParticipantListProgramTypes: z.array(z.enum(ProgramType)),
  fixedLotterySignupTime: z.iso.datetime().nullable(),
  entryConditions: z.array(
    z.object({
      conditionText: z.enum(EntryConditionText),
      programItemIds: z.array(z.string()),
    }),
  ),
  activeProgramTypes: z.array(z.enum(ProgramType)),
  removeLotterySignupsStrategy: z.enum(RemoveLotterySignupsStrategy),
  customDetailsProgramItems: z.record(
    z.string(),
    z
      .object({
        tags: z.array(z.enum(Tag)).optional(),
        ageGroups: z.array(z.enum(AgeGroup)).optional(),
        languages: z.array(z.enum(Language)).optional(),
      })
      .optional(),
  ),
  enableRevolvingDoor: z.boolean(),
  programGuideUrlFi: z.string(),
  programGuideUrlEn: z.string(),
  startTimesByParentIds: z.map(z.string(), z.iso.datetime()),
  defaultSignupType: z.enum(SignupType),
  enableTagDropdown: z.boolean(),
  defaultSignupStrategy: z.enum(EventSignupStrategy),
  defaultLoginProvider: z.enum(LoginProvider),
});

export type EventConfig = z.infer<typeof EventConfigSchema>;
