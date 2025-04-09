import mongoose from "mongoose";
import { ResultDoc } from "server/types/resultTypes";

const ResultsSchema = new mongoose.Schema(
  {
    results: [
      {
        username: String,
        directSignup: {
          programItemId: String,
          priority: Number,
          time: Date,
        },
      },
    ],
    startTime: Date,
    algorithm: String,
    message: String,
  },
  { timestamps: true },
);

export const ResultsModel = mongoose.model<ResultDoc>("results", ResultsSchema);
