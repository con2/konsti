import mongoose from "mongoose";
import {
  RequiredDate,
  RequiredNumber,
  RequiredString,
} from "server/db/mongooseTypes";
import { ResultDoc } from "server/typings/result.typings";

const ResultsSchema = new mongoose.Schema(
  {
    results: [
      {
        username: RequiredString,
        enteredGame: {
          gameDetails: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Game",
            required: true,
          },
          priority: RequiredNumber,
          time: RequiredDate,
        },
      },
    ],
    startTime: RequiredDate,
    algorithm: RequiredString,
    message: RequiredString,
  },
  { timestamps: true }
);

export const ResultsModel = mongoose.model<ResultDoc>("Results", ResultsSchema);
