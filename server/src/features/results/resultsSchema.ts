import mongoose from "mongoose";
import { z } from "zod";
import dayjs from "dayjs";

export const ResultsSchemaDb = z
  .object({
    results: z.array(
      z.object({
        username: z.string(),
        assignmentSignup: z.object({
          programItemId: z.string(),
          priority: z.number(),
          signedToStartTime: z
            .date()
            .transform((date) => dayjs(date).toISOString()),
        }),
      }),
    ),
    assignmentTime: z.date().transform((date) => dayjs(date).toISOString()),
    algorithm: z.string(),
    message: z.string(),
  })
  .strip();

const assignmentSignupSchema = new mongoose.Schema({
  programItemId: { type: String, required: true },
  priority: { type: Number, required: true },
  signedToStartTime: {
    type: Date,
    get: (value: Date) => new Date(value),
    required: true,
  },
});

const resultsArraySchema = new mongoose.Schema({
  username: { type: String, required: true },
  assignmentSignup: { type: assignmentSignupSchema, required: true },
});

const resultsSchema = new mongoose.Schema(
  {
    results: { type: [resultsArraySchema], required: true },
    assignmentTime: {
      type: Date,
      get: (value: Date) => new Date(value),
      required: true,
    },
    algorithm: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

export const ResultsModel = mongoose.model("results", resultsSchema);
