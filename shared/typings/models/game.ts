import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";

export enum ProgramType {
  TABLETOP_RPG = "tabletopRPG",
  LARP = "larp",
  TOURNAMENT = "tournament",
  WORKSHOP = "workshop",
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
  RULES_HEAVY = "rulesHeavy",
  RULES_LIGHT = "rulesLight",
  STORY_DRIVEN = "storyDriven",
  CHARACTER_DRIVEN = "characterDriven",
  COMBAT_DRIVEN = "combatDriven",
}

export enum Tag {
  IN_ENGLISH = "inEnglish",
  CHILDREN_FRIENDLY = "childrenFriendly",
  AGE_RESTRICTED = "ageRestricted",
  BEGINNER_FRIENDLY = "beginnerFriendly",
  GUEST_OF_HONOR = "guestOfHonor",
  FAMILY = "family",
  THEME_ELEMENTS = "themeElements",
  SUITABLE_UNDER_7 = "suitableUnder7",
  SUITABLE_7_TO_12 = "suitable7to12",
  SUITABLE_OVER_12 = "suitableOver12",
  NOT_SUITABLE_UNDER_15 = "notSuitableUnder15",
  CHILDRENS_PROGRAM = "childrensProgram",
  SUITABLE_UNDER_10 = "suitableUnder10",
  FOR_MINORS = "forMinors",
  FOR_ADULTS = "forAdults",
  THEME_FRIENDSHIP = "themeFriendship",
  DEMO = "demo",
  TOURNAMENT = "tournament",
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
  REMAINING_ONE_PLACE = "remainingOnePlace",
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
  otherInaccessibility: z.string(),
  entryFee: z.number(),
});

export type Game = z.infer<typeof GameSchema>;

export interface GameWithUsernames {
  game: Game;
  users: UserSignup[];
}

export interface UserSignup {
  username: string;
  signupMessage: string;
}
