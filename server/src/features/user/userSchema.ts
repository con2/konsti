import mongoose from "mongoose";
import { User } from "shared/types/models/user";

const UserSchema = new mongoose.Schema(
  {
    kompassiId: Number,
    kompassiUsernameAccepted: Boolean,
    username: String,
    password: String,
    userGroup: String,
    serial: String,
    groupCreatorCode: String,
    groupCode: String,
    favoriteProgramItemIds: [String],
    lotterySignups: [
      {
        programItemId: String,
        priority: Number,
        signedToStartTime: Date,
      },
    ],
    eventLogItems: [
      {
        action: String,
        programItemId: String,
        programItemStartTime: Date,
        isSeen: Boolean,
        createdAt: Date,
      },
    ],
  },
  { timestamps: true },
);

interface UserDoc extends User, mongoose.Document {}

export const UserModel = mongoose.model<UserDoc>("user", UserSchema);
