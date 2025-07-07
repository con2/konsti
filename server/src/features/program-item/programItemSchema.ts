import mongoose from "mongoose";
import { z } from "zod";
import dayjs from "dayjs";
import {
  InclusivityValue,
  Genre,
  Language,
  Gamestyle,
  Popularity,
  SignupStrategy,
  ProgramType,
  SignupType,
  Tag,
  State,
} from "shared/types/models/programItem";

export const ProgramItemSchemaDb = z
  .object({
    programItemId: z.string(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    startTime: z.date().transform((date) => dayjs(date).toISOString()),
    mins: z.number(),
    tags: z.array(z.nativeEnum(Tag)),
    genres: z.array(z.nativeEnum(Genre)),
    styles: z.array(z.nativeEnum(Gamestyle)),
    languages: z.array(z.nativeEnum(Language)),
    endTime: z.date().transform((date) => dayjs(date).toISOString()),
    people: z.string(),
    minAttendance: z.number(),
    maxAttendance: z.number(),
    gameSystem: z.string(),
    popularity: z.nativeEnum(Popularity),
    shortDescription: z.string(),
    revolvingDoor: z.boolean(),
    programType: z.nativeEnum(ProgramType),
    contentWarnings: z.string(),
    otherAuthor: z.string(),
    accessibilityValues: z.array(z.nativeEnum(InclusivityValue)),
    signupStrategy: z.optional(z.nativeEnum(SignupStrategy)),
    otherAccessibilityInformation: z.string(),
    entryFee: z.string(),
    signupType: z.nativeEnum(SignupType),
    state: z.nativeEnum(State),
  })
  .strip();

const programItemSchema = new mongoose.Schema(
  {
    programItemId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startTime: {
      type: Date,
      get: (value: Date) => new Date(value),
      required: true,
    },
    mins: { type: Number, required: true },
    tags: { type: [String], required: true },
    genres: { type: [String], required: true },
    styles: { type: [String], required: true },
    languages: { type: [String], required: true },
    endTime: {
      type: Date,
      get: (value: Date) => new Date(value),
      required: true,
    },
    people: { type: String, required: true },
    minAttendance: { type: Number, required: true },
    maxAttendance: { type: Number, required: true },
    gameSystem: { type: String, required: true },
    shortDescription: { type: String, required: true },
    revolvingDoor: { type: Boolean, required: true },
    popularity: { type: String, default: Popularity.NULL },
    programType: { type: String, required: true },
    contentWarnings: { type: String, required: true },
    otherAuthor: { type: String, required: true },
    accessibilityValues: { type: [String], required: true },
    otherAccessibilityInformation: { type: String, required: true },
    entryFee: { type: String, required: true },
    signupType: { type: String, required: true },
    state: { type: String, required: true },
  },
  { timestamps: true },
);

export const ProgramItemModel = mongoose.model(
  "program-item",
  programItemSchema,
);
