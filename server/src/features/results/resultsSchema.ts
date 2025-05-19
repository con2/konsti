import mongoose from "mongoose";
import { UserAssignmentResult } from "shared/types/models/result";

const ResultsSchema = new mongoose.Schema(
  {
    results: [
      {
        username: String,
        assignmentSignup: {
          programItemId: String,
          priority: Number,
          signedToStartTime: Date,
        },
      },
    ],
    assignmentTime: Date,
    algorithm: String,
    message: String,
  },
  { timestamps: true },
);

interface ResultDoc extends UserAssignmentResult, mongoose.Document {}

export const ResultsModel = mongoose.model<ResultDoc>("results", ResultsSchema);
