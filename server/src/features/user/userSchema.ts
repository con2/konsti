import mongoose, { ObjectId } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { z } from "zod";
import dayjs from "dayjs";
import { EventLogAction } from "shared/types/models/eventLog";
import { UserGroup } from "shared/types/models/user";

const LotterySignupSchemaDb = z.object({
  programItemId: z.string(),
  priority: z.number(),
  signedToStartTime: z.date().transform((date) => dayjs(date).toISOString()),
});

const EventLogItemSchemaDb = z.object({
  eventLogItemId: z.custom<ObjectId>().transform(String),
  action: z.nativeEnum(EventLogAction),
  isSeen: z.boolean(),
  programItemId: z.string(),
  programItemStartTime: z.date().transform((date) => dayjs(date).toISOString()),
  createdAt: z.date().transform((date) => dayjs(date).toISOString()),
});

export const UserSchemaDb = z
  .object({
    kompassiId: z.number(),
    kompassiUsernameAccepted: z.boolean(),
    username: z.string(),
    password: z.string(),
    userGroup: z.nativeEnum(UserGroup),
    serial: z.string(),
    groupCode: z.string(),
    groupCreatorCode: z.string(),
    favoriteProgramItemIds: z.array(z.string()),
    lotterySignups: z.array(LotterySignupSchemaDb),
    createdAt: z.date().transform((date) => dayjs(date).toISOString()),
    eventLogItems: z.array(EventLogItemSchemaDb),
    email: z.string(),
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
    kompassiId: { type: Number, required: true },
    kompassiUsernameAccepted: { type: Boolean, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    userGroup: { type: String, required: true },
    serial: { type: String, required: true },
    groupCreatorCode: { type: String, required: true },
    groupCode: { type: String, required: true },
    favoriteProgramItemIds: { type: [String], required: true },
    lotterySignups: { type: [lotterySignupSchema], required: true },
    eventLogItems: { type: [eventLogItemSchema], required: true },
    email: { type: String, required: true },
    emailNotificationPermitAsked: { type: Boolean, requires: true },
    createdAt: {
      type: Date,
      get: (value: Date) => new Date(value),
    },
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(mongooseLeanVirtuals, {
  enabledByDefault: true,
});

export const UserModel = mongoose.model("user", userSchema);
