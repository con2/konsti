import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";

const AccessibilitySchema = z.object({
  loudSounds: z.boolean(),
  flashingLights: z.boolean(),
  strongSmells: z.boolean(),
  irritateSkin: z.boolean(),
  physicalContact: z.boolean(),
  lowLighting: z.boolean(),
  movingAround: z.boolean(),
  video: z.boolean(),
  recording: z.boolean(),
  text: z.boolean(),
  colourblind: z.boolean(),
});

export const GameSchema = z.object({
  gameId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  startTime: z.string(),
  mins: z.number(),
  tags: z.array(z.string()),
  genres: z.array(z.string()),
  styles: z.array(z.string()),
  language: z.string(),
  endTime: z.string(),
  people: z.string(),
  minAttendance: z.number(),
  maxAttendance: z.number(),
  gameSystem: z.string(),
  englishOk: z.boolean(),
  childrenFriendly: z.boolean(),
  ageRestricted: z.boolean(),
  beginnerFriendly: z.boolean(),
  intendedForExperiencedParticipants: z.boolean(),
  popularity: z.number(),
  shortDescription: z.string(),
  revolvingDoor: z.boolean(),
  programType: z.string(),
  contentWarnings: z.string(),
  otherAuthor: z.string(),
  accessibility: AccessibilitySchema,
  signupStrategy: z.optional(z.nativeEnum(SignupStrategy)),
});

export type Game = z.infer<typeof GameSchema>;
