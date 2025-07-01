import { z } from "zod";

export enum ProgramType {
  TABLETOP_RPG = "tabletopRPG",
  LARP = "larp",
  TOURNAMENT = "tournament",
  WORKSHOP = "workshop",
  EXPERIENCE_POINT = "experiencePoint",
  OTHER = "other",
  ROUNDTABLE_DISCUSSION = "roundtableDiscussion",
  FLEAMARKET = "fleaMarket",
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

export enum Gamestyle {
  SERIOUS = "serious",
  LIGHT = "light",
  RULES_HEAVY = "rulesHeavy",
  RULES_LIGHT = "rulesLight",
  STORY_DRIVEN = "storyDriven",
  CHARACTER_DRIVEN = "characterDriven",
  COMBAT_HEAVY = "combatHeavy",
}

export enum Language {
  FINNISH = "finnish",
  ENGLISH = "english",
  SWEDISH = "swedish",
  LANGUAGE_FREE = "languageFree",
}

export enum Tag {
  BEGINNER_FRIENDLY = "beginnerFriendly",
  THEME = "theme",
  LGBT = "lgbt",
  GUEST_OF_HONOR = "guestOfHonor",
  EVERYONE = "everyone",
  ADULTS = "adults",
  TEENS = "teens",
  ONLY_ADULTS = "onlyAdults",
  KIDS = "kids",
  SMALL_KIDS = "smallKids",
}

export enum InclusivityValue {
  COLOR_BLINDNESS = "colorBlindness",
  FINGERS = "fingers",
  LOUD_SOUNDS = "loudSounds",
  PHYSICAL_CONTACT = "physicalContact",
  LONG_PROGRAM = "longProgram",
  NOT_AMPLIFIED = "notAmplified",
  NO_RECORDING_OR_SPOKEN_TEXT = "noRecordingsOrSpokenText",
  DARK_LIGHTING = "darkLighting",
  NO_MOVEMENT = "noMovement",
  NO_TEXT_OF_RECORDING = "noTextOfRecording",
  LONG_TEXTS = "longTexts",
  LOTS_OF_MOVEMENT = "lotsOfMovement",
  FLASHING_LIGHTS = "flahingLights",
  QUICK_REACTIONS = "quickReactions",
  NO_SUBTITLES = "noSubtitles",
  STRONG_ODOURS = "strongOdours",
  IRRITATING_CHEMICALS = "irritatingChemicals",
}

export enum SignupStrategy {
  DIRECT = "direct",
  LOTTERY = "lottery",
}

export enum SignupType {
  KONSTI = "konsti",
  NONE = "none",
}

export enum Popularity {
  NULL = "notSet",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "veryHigh",
  EXTREME = "extreme",
}

export const ProgramItemSchema = z.object({
  programItemId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  startTime: z.string(),
  mins: z.number(),
  tags: z.array(z.nativeEnum(Tag)),
  genres: z.array(z.nativeEnum(Genre)),
  styles: z.array(z.nativeEnum(Gamestyle)),
  languages: z.array(z.nativeEnum(Language)),
  endTime: z.string(),
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
});

export type ProgramItem = z.infer<typeof ProgramItemSchema>;

export interface ProgramItemWithUserSignups {
  programItem: ProgramItem;
  users: UserSignup[];
}

export interface UserSignup {
  username: string;
  signupMessage: string;
}
