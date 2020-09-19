import mongoose from 'mongoose';
import { UserDoc } from 'typings/user.typings';

const UserSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    userGroup: String,
    serial: String,
    groupCode: String,
    favoritedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    signedGames: [
      {
        gameDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
        priority: Number,
        time: Date,
      },
    ],
    enteredGames: [
      {
        gameDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
        priority: Number,
        time: Date,
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>('User', UserSchema);
