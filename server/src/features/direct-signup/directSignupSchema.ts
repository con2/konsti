import mongoose from "mongoose";
import { DirectSignupDoc } from "server/features/direct-signup/directSignupTypes";

const DirectSignupSchema = new mongoose.Schema(
  {
    programItemId: String,
    userSignups: [
      {
        username: String,
        priority: Number,
        signedToStartTime: Date,
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
