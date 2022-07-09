import mongoose from "mongoose";
import {
  RequiredDate,
  RequiredNumber,
  RequiredString,
} from "server/db/mongooseTypes";
import { SignupDoc } from "server/features/signup/signup.typings";

const SignupSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    userSignups: {
      type: [
        {
          username: RequiredString,
          priority: RequiredNumber,
          time: RequiredDate,
          message: RequiredString,
        },
      ],
      required: true,
    },
    count: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export const SignupModel = mongoose.model<SignupDoc>("Signup", SignupSchema);
