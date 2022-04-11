import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";

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
  RULES_HEAVY = "rules_heavy",
  RULES_LIGHT = "rules_light",
  STORY_DRIVEN = "story_driven",
  CHARACTER_DRIVEN = "character_driven",
  COMBAT_DRIVEN = "combat_driven",
}

export enum Tag {
  IN_ENGLISH = "inEnglish",
  CHILDREN_FRIENDLY = "childrenFriendly",
  AGE_RESTRICTED = "ageRestricted",
  BEGINNER_FRIENDLY = "beginnerFriendly",
  FOR_EXPERIENCED_PARTICIPANTS = "intendedForExperiencedParticipants",
  GUEST_OF_HONOR = "guestOfHonor",
  FAMILY = "family",
  THEME_ELEMENTS = "themeElements",
  SUITABLE_UNDER_7 = "suitableUnder7",
  SUITABLE_7_TO_12 = "suitable7to12",
  SUITABLE_OVER_12 = "suitableOver12",
  NOT_SUITABLE_UNDER_15 = "notSuitableUnder15",
  CHILDRENS_PROGRAM = "childrensProgram",
}

export enum AccessibilityValue {
  LOUD_SOUNDS = "loudSounds",
  FLASHING_LIGHTS = "flashingLights",
  STRONG_SMELLS = "strongSmells",
  IRRITATE_SKIN = "irritateSkin",
  PHYSICAL_CONTACT = "physicalContact",
  LOW_LIGHTING = "lowLighting",
  MOVING_AROUND = "movingAround",
  VIDEO = "video",
  RECORDING = "recording",
  TEXT = "text",
  COLOURBLIND = "colourblind",
}

export const GameSchema = z.object({
  gameId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  startTime: z.string(),
  mins: z.number(),
  tags: z.array(z.nativeEnum(Tag)),
  genres: z.array(z.nativeEnum(Genre)),
  styles: z.array(z.nativeEnum(GameStyle)),
  language: z.string(),
  endTime: z.string(),
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
  signupStrategy: z.optional(z.nativeEnum(SignupStrategy)),
});

export type Game = z.infer<typeof GameSchema>;
