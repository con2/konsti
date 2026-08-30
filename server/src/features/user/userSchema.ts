// Registers the global mongoose plugins, which are applied when a model is
// compiled below, so it has to stay above the other imports
import "server/db/mongoosePlugins";
import mongoose, { ObjectId } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { z } from "zod";
import { StoredEmailSchema } from "shared/constants/validation";
import { EventLogAction } from "shared/types/models/eventLog";
import { ProgramType } from "shared/types/models/programItem";
import { UserGroup } from "shared/types/models/user";

const LotterySignupSchemaDb = z.object({
  programItemId: z.string(),
  priority: z.number(),
  signedToStartTime: z.date().transform((date) => date.toISOString()),
});

const EventLogItemSchemaDb = z.object({
  eventLogItemId: z.custom<ObjectId>().transform(String),
  action: z.enum(EventLogAction),
  isSeen: z.boolean(),
  programItemId: z.string(),
  programItemStartTime: z.date().transform((date) => date.toISOString()),
  lastProgramItemEndTime: z.optional(
    z.date().transform((date) => date.toISOString()),
  ),
  programType: z.optional(z.enum(ProgramType)),
  createdAt: z.date().transform((date) => date.toISOString()),
});

export const UserSchemaDb = z
  .object({
    kompassiId: z.string(),
    kompassiUsernameAccepted: z.boolean(),
    username: z.string(),
    password: z.string(),
    userGroup: z.enum(UserGroup),
    serial: z.string(),
    groupCode: z.string(),
    isGroupCreator: z.boolean(),
    favoriteProgramItemIds: z.array(z.string()),
    lotterySignups: z.array(LotterySignupSchemaDb),
    createdAt: z.date().transform((date) => date.toISOString()),
    eventLogItems: z.array(EventLogItemSchemaDb),
    email: StoredEmailSchema,
    emailNotificationPermitAsked: z.boolean(),
  })
  .strip();

const lotterySignupSchema = new mongoose.Schema({
  programItemId: { type: String, required: true },
  priority: { type: Number, required: true },
  signedToStartTime: {
    type: Date,
    get: (value: Date) => new Date(value),
    required: true,
  },
});

const eventLogItemSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    programItemId: { type: String, required: true },
    programItemStartTime: {
      type: Date,
      get: (value: Date) => new Date(value),
      required: true,
    },
    // No getter: absent on every event log item but a batched lottery's rejection, and a getter
    // would turn that absence into an Invalid Date on the toObject/toJSON path
    lastProgramItemEndTime: { type: Date },
    programType: { type: String },
    isSeen: { type: Boolean, required: true },
    createdAt: { type: Date, get: (value: Date) => new Date(value) },
  },
  {
    virtuals: {
      eventLogItemId: {
        get(this: { _id: ObjectId }) {
          return this._id;
        },
      },
    },
  },
);

const userSchema = new mongoose.Schema(
  {
    // No `required`: "" is the meaningful value for a local account, and the
    // global validator override that lets empty strings satisfy `required`
    // only loads with the Express app - tests connecting straight to the DB
    // would reject every local account. The default covers the undefined case.
    kompassiId: { type: String, default: "" },
    kompassiUsernameAccepted: { type: Boolean, required: true },
    // Usernames identify a user everywhere: sign-ups, event log writes and
    // assignment results all match on this field, and a username-filtered update
    // only ever reaches one document. A second document with the same name would
    // silently collect writes meant for the other.
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userGroup: { type: String, required: true },
    serial: { type: String, required: true },
    isGroupCreator: { type: Boolean, required: true },
    groupCode: { type: String, required: true },
    favoriteProgramItemIds: { type: [String], required: true },
    lotterySignups: { type: [lotterySignupSchema], required: true },
    eventLogItems: { type: [eventLogItemSchema], required: true },
    email: { type: String, required: false },
    emailNotificationPermitAsked: { type: Boolean, required: true },
    createdAt: {
      type: Date,
      get: (value: Date) => new Date(value),
    },
  },
  {
    timestamps: true,
  },
);

// One Konsti account per Kompassi identity, and an index for the lookup every
// Kompassi login does. Partial so it ignores the "" local accounts share,
// which would otherwise all collide with each other.
userSchema.index(
  { kompassiId: 1 },
  { unique: true, partialFilterExpression: { kompassiId: { $gt: "" } } },
);

userSchema.plugin(mongooseLeanVirtuals, {
  enabledByDefault: true,
});

export const UserModel = mongoose.model("user", userSchema);
