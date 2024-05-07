import mongoose from "mongoose";
import { DirectSignupDoc } from "server/features/direct-signup/directSignupTypes";

const DirectSignupSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    userSignups: [
      {
        username: String,
        priority: Number,
        time: Date,
        message: String,
      },
    ],
    count: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const SignupModel = mongoose.model<DirectSignupDoc>(
  "direct-signup",
  DirectSignupSchema,
);
