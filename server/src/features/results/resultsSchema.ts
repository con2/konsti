// Registers the global mongoose plugins, which are applied when a model is
// compiled below, so it has to stay above the other imports
import "server/db/mongoosePlugins";
import mongoose from "mongoose";
import { z } from "zod";

export const ResultsSchemaDb = z
  .object({
    results: z.array(
      z.object({
        username: z.string(),
        assignmentSignup: z.object({
          programItemId: z.string(),
          priority: z.number(),
          signedToStartTime: z.date().transform((date) => date.toISOString()),
        }),
      }),
    ),
    // Snapshot of the groups that took part in this lottery run, as they were when it ran
    groups: z.array(
      z.object({
        groupCode: z.string(),
        groupCreator: z.string(),
        groupMembers: z.array(z.string()),
      }),
    ),
    assignmentTime: z.date().transform((date) => date.toISOString()),
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

const groupSchema = new mongoose.Schema({
  groupCode: { type: String, required: true },
  groupCreator: { type: String, required: true },
  groupMembers: { type: [String], required: true },
});

const resultsSchema = new mongoose.Schema(
  {
    results: { type: [resultsArraySchema], required: true },
    groups: { type: [groupSchema], required: true },
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
