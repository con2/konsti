import mongoose from "mongoose";
import { SignupDoc } from "server/features/signup/signup.typings";

const SignupSchema = new mongoose.Schema(
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
  { timestamps: true }
);

export const SignupModel = mongoose.model<SignupDoc>("Signup", SignupSchema);
