import mongoose from "mongoose";
import { GameDoc } from "server/types/gameTypes";

const gameSchema = new mongoose.Schema(
  {
    gameId: String,
    title: String,
    description: String,
    location: String,
    startTime: Date,
    mins: Number,
    tags: Array,
    genres: Array,
    styles: Array,
    language: String,
    endTime: Date,
    people: String,
    minAttendance: Number,
    maxAttendance: Number,
    gameSystem: String,
    shortDescription: String,
    revolvingDoor: Boolean,
    popularity: { type: Number, default: 0 },
    programType: String,
    contentWarnings: String,
    otherAuthor: String,
    accessibilityValues: Array,
    otherAccessibilityInformation: String,
    entryFee: String,
    signupType: String,
  },
  { timestamps: true },
);

export const GameModel = mongoose.model<GameDoc>("game", gameSchema);
