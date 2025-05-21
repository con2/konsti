import mongoose, { ObjectId } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { z } from "zod";
import { EventLogAction } from "shared/types/models/eventLog";
import { UserGroup } from "shared/types/models/user";

const LotterySignupSchemaDb = z.object({
  programItemId: z.string(),
  priority: z.number(),
  signedToStartTime: z.date(),
});

const EventLogItemSchemaDb = z.object({
  eventLogItemId: z.custom<ObjectId>().transform(String),
  action: z.nativeEnum(EventLogAction),
  isSeen: z.boolean(),
  programItemId: z.string(),
  programItemStartTime: z.date(),
  createdAt: z.date(),
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
    createdAt: z.date(),
    eventLogItems: z.array(EventLogItemSchemaDb),
  })
  .strip();

type UserDb = z.infer<typeof UserSchemaDb>;

const eventLogItemSchema = new mongoose.Schema(
  {
    action: String,
    programItemId: String,
    programItemStartTime: {
      type: Date,
      get: (value: Date) => new Date(value),
    },
    isSeen: Boolean,
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

const userSchema = new mongoose.Schema<UserDb>(
  {
    kompassiId: Number,
    kompassiUsernameAccepted: Boolean,
    username: String,
    password: String,
    userGroup: String,
    serial: String,
    groupCreatorCode: String,
    groupCode: String,
    favoriteProgramItemIds: [String],
    createdAt: {
      type: Date,
      get: (value: Date) => new Date(value),
    },
    lotterySignups: [
      {
        programItemId: String,
        priority: Number,
        signedToStartTime: {
          type: Date,
          get: (value: Date) => new Date(value),
        },
      },
    ],
    eventLogItems: [eventLogItemSchema],
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(mongooseLeanVirtuals, {
  enabledByDefault: true,
});

export const UserModel = mongoose.model<UserDb>("user", userSchema);
