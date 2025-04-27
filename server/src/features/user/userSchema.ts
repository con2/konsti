import mongoose from "mongoose";
import { UserDoc } from "server/types/userTypes";

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
        time: Date,
        message: String,
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

export const UserModel = mongoose.model<UserDoc>("user", UserSchema);
