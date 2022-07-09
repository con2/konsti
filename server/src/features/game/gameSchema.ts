import mongoose from "mongoose";
import {
  RequiredBoolean,
  RequiredDate,
  RequiredNumber,
  RequiredString,
} from "server/db/mongooseTypes";
import { GameDoc } from "server/typings/game.typings";

const gameSchema = new mongoose.Schema(
  {
    gameId: RequiredString,
    title: RequiredString,
    description: RequiredString,
    location: RequiredString,
    startTime: RequiredDate,
    mins: RequiredNumber,
    tags: { type: [RequiredString], required: true },
    genres: { type: [RequiredString], required: true },
    styles: { type: [RequiredString], required: true },
    language: RequiredString,
    endTime: RequiredDate,
    people: RequiredString,
    minAttendance: RequiredNumber,
    maxAttendance: RequiredNumber,
    gameSystem: RequiredString,
    shortDescription: RequiredString,
    revolvingDoor: RequiredBoolean,
    popularity: { type: Number, default: 0, required: true },
    programType: RequiredString,
    contentWarnings: RequiredString,
    otherAuthor: RequiredString,
    accessibilityValues: { type: [RequiredString], required: true },
    otherInaccessibility: RequiredString,
  },
  { timestamps: true }
);

export const GameModel = mongoose.model<GameDoc>("Game", gameSchema);
