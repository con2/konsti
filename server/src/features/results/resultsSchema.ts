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
          signedToStartTime: z.date(),
        }),
      }),
    ),
    assignmentTime: z.date(),
    algorithm: z.string(),
    message: z.string(),
  })
  .strip();

type ResultsDb = z.infer<typeof ResultsSchemaDb>;

const resultsSchema = new mongoose.Schema<ResultsDb>(
  {
    results: [
      {
        username: String,
        assignmentSignup: {
          programItemId: String,
          priority: Number,
          signedToStartTime: {
            type: Date,
            get: (value: Date) => new Date(value),
          },
        },
      },
    ],
    assignmentTime: { type: Date, get: (value: Date) => new Date(value) },
    algorithm: String,
    message: String,
  },
  { timestamps: true },
);

export const ResultsModel = mongoose.model<ResultsDb>("results", resultsSchema);
