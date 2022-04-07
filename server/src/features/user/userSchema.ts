import mongoose from "mongoose";
import { UserDoc } from "server/typings/user.typings";

const UserSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    userGroup: String,
    serial: String,
    groupCode: String,
    favoritedGames: [{ type: String }],
    signedGames: [
      {
        gameDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        priority: Number,
        time: Date,
        message: String,
      },
    ],
    enteredGames: [
      {
        gameDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        priority: Number,
        time: Date,
        message: String,
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
