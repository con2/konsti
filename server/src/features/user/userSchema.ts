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
    favoritedGames: {
      type: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
      ],
      required: true,
    },
    signedGames: {
      type: [
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
      required: true,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("User", UserSchema);
