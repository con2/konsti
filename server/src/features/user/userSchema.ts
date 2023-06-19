import mongoose from "mongoose";
import { UserDoc } from "server/typings/user.typings";

const UserSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    userGroup: String,
    serial: String,
    groupCode: String,
    favoritedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
    signedGames: [
      {
        gameDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        priority: Number,
        time: Date,
        message: String,
      },
    ],
    eventLogItems: [
      {
        action: String,
        programItemId: String,
        isSeen: Boolean,
        createdAt: Date,
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
