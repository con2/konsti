import mongoose from "mongoose";
import { DirectSignupsForProgramItem } from "server/features/direct-signup/directSignupTypes";

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

interface DirectSignupDoc
  extends DirectSignupsForProgramItem,
    mongoose.Document {}

export const SignupModel = mongoose.model<DirectSignupDoc>(
  "direct-signup",
  DirectSignupSchema,
);
