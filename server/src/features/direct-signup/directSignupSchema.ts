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
    count: z.number(),
  })
  .strip();

const userSignupSchema = new mongoose.Schema({
  username: { type: String, required: true },
  priority: { type: Number, required: true },
  signedToStartTime: {
    type: Date,
    get: (value: Date) => new Date(value),
    required: true,
  },
  message: { type: String, required: true },
});

const directSignupSchema = new mongoose.Schema(
  {
    programItemId: { type: String, required: true },
    userSignups: { type: [userSignupSchema], required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const SignupModel = mongoose.model("direct-signup", directSignupSchema);
