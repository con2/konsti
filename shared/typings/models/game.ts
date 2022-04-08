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

export enum ProgramType {
  TABLETOP_RPG = "tabletopRPG",
  FREEFORM_RPG = "freeformRPG",
  LARP = "larp",
  UNKNOWN = "unknown",
}

export enum Genre {
  FANTASY = "fantasy",
  SCIFI = "scifi",
  HISTORICAL = "historical",
  MODERN = "modern",
  WAR = "war",
  HORROR = "horror",
  EXPLORATION = "exploration",
  MYSTERY = "mystery",
  DRAMA = "drama",
  HUMOR = "humor",
  ADVENTURE = "adventure",
}

export enum GameStyle {
  SERIOUS = "serious",
  LIGHT = "light",
  RULES_HEAVE = "rules_heavy",
  RULES_LIGHT = "rules_light",
  STORY_DRIVEN = "story_driven",
  CHARACTER_DRIVEN = "character_driven",
  COMBAT_DRIVEN = "combat_driven",
}

export const GameSchema = z.object({
  gameId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  startTime: z.string(),
  mins: z.number(),
  tags: z.array(z.string()),
  genres: z.array(z.nativeEnum(Genre)),
  styles: z.array(z.nativeEnum(GameStyle)),
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
  programType: z.nativeEnum(ProgramType),
  contentWarnings: z.string(),
  otherAuthor: z.string(),
  accessibility: AccessibilitySchema,
  signupStrategy: z.optional(z.nativeEnum(SignupStrategy)),
});

export type Game = z.infer<typeof GameSchema>;
