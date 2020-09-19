import mongoose from 'mongoose';
import { ResultDoc } from 'typings/result.typings';

const ResultsSchema = new mongoose.Schema(
  {
    results: [
      {
        username: String,
        enteredGame: {
          gameDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
          priority: Number,
          time: Date,
        },
      },
    ],
    startTime: Date,
    algorithm: String,
    message: String,
  },
  { timestamps: true }
);

export const ResultsModel = mongoose.model<ResultDoc>('Results', ResultsSchema);
