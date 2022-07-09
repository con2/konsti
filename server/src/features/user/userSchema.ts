import mongoose from "mongoose";
import {
  RequiredDate,
  RequiredNumber,
  RequiredString,
} from "server/db/mongooseTypes";
import { UserDoc } from "server/typings/user.typings";

const UserSchema = new mongoose.Schema(
  {
    username: RequiredString,
    password: RequiredString,
    userGroup: RequiredString,
    serial: RequiredString,
    groupCode: RequiredString,
    favoritedGames: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    ],
    signedGames: [
      {
        gameDetails: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Game",
          required: true,
        },
        priority: RequiredNumber,
        time: RequiredDate,
        message: RequiredString,
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
