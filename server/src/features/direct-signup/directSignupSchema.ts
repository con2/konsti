import mongoose from "mongoose";
import { z } from "zod";
import dayjs from "dayjs";

const UserSignupsSchema = z.object({
  username: z.string(),
  priority: z.number(),
  signedToStartTime: z.date().transform((date) => dayjs(date).toISOString()),
  message: z.string(),
});

export const DirectSignupSchemaDb = z
  .object({
    programItemId: z.string(),
    userSignups: z.array(UserSignupsSchema),
    count: z.number().optional(),
  })
  .strip();

const directSignupSchema = new mongoose.Schema(
  {
    programItemId: String,
    userSignups: [
      {
        username: String,
        priority: Number,
        signedToStartTime: {
          type: Date,
          get: (value: Date) => new Date(value),
        },
        message: String,
      },
    ],
    count: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const SignupModel = mongoose.model("direct-signup", directSignupSchema);
