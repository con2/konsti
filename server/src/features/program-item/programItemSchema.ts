import mongoose from "mongoose";
import { ProgramItem } from "shared/types/models/programItem";

const programItemSchema = new mongoose.Schema(
  {
    programItemId: String,
    title: String,
    description: String,
    location: String,
    startTime: Date,
    mins: Number,
    tags: Array,
    genres: Array,
    styles: Array,
    languages: [String],
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

interface ProgramItemDoc extends ProgramItem, mongoose.Document {}

export const ProgramItemModel = mongoose.model<ProgramItemDoc>(
  "program-item",
  programItemSchema,
);
