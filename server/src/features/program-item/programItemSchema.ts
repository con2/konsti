import mongoose from "mongoose";
import { z } from "zod";
import dayjs from "dayjs";
import {
  AccessibilityValue,
  Genre,
  Language,
  Playstyle,
  ProgramItemSignupStrategy,
  ProgramType,
  SignupType,
  Tag,
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
    styles: z.array(z.nativeEnum(Playstyle)),
    languages: z.array(z.nativeEnum(Language)),
    endTime: z.date().transform((date) => dayjs(date).toISOString()),
    people: z.string(),
    minAttendance: z.number(),
    maxAttendance: z.number(),
    gameSystem: z.string(),
    popularity: z.number(),
    shortDescription: z.string(),
    revolvingDoor: z.boolean(),
    programType: z.nativeEnum(ProgramType),
    contentWarnings: z.string(),
    otherAuthor: z.string(),
    accessibilityValues: z.array(z.nativeEnum(AccessibilityValue)),
    signupStrategy: z.optional(z.nativeEnum(ProgramItemSignupStrategy)),
    otherAccessibilityInformation: z.string(),
    entryFee: z.string(),
    signupType: z.nativeEnum(SignupType),
  })
  .strip();

type ProgramItemDb = z.infer<typeof ProgramItemSchemaDb>;

const programItemSchema = new mongoose.Schema<ProgramItemDb>(
  {
    programItemId: String,
    title: String,
    description: String,
    location: String,
    // @ts-expect-error -- Zod type takes date but returns string
    startTime: { type: Date, get: (value: Date) => new Date(value) },
    mins: Number,
    tags: Array,
    genres: Array,
    styles: Array,
    languages: [String],
    // @ts-expect-error -- Zod type takes date but returns string
    endTime: { type: Date, get: (value: Date) => new Date(value) },
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

export const ProgramItemModel = mongoose.model<ProgramItemDb>(
  "program-item",
  programItemSchema,
);
