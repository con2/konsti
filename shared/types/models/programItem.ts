import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfigTypes";

export enum ProgramType {
  TABLETOP_RPG = "tabletopRPG",
  LARP = "larp",
  TOURNAMENT = "tournament",
  WORKSHOP = "workshop",
  EXPERIENCE_POINT = "experiencePoint",
  OTHER = "other",
  ROUNDTABLE_DISCUSSION = "roundtableDiscussion",
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

export enum Language {
  FINNISH = "finnish",
  ENGLISH = "english",
  SWEDISH = "swedish",
  LANGUAGE_FREE = "languageFree",
}

export enum Tag {
  CHILDREN_FRIENDLY = "childrenFriendly",
  BEGINNER_FRIENDLY = "beginnerFriendly",
  GUEST_OF_HONOR = "guestOfHonor",
  AIMED_UNDER_13 = "aimedAtChildrenUnder13",
  AIMED_BETWEEN_13_17 = "aimedAtChildrenBetween13to17",
  AIMED_ADULTS = "aimedAtAdultAttendees",
  FOR_18_PLUS_ONLY = "for18PlusOnly",
  INTENDED_FOR_EXPERIENCED_PARTICIPANTS = "forExperiencedParticipants",
  ALL_AGES = "allAges",
  THEME_MONSTERS = "themeMonsters",
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
  COLORBLIND = "colourblind",
  DURATION_OVER_2H = "durationOver2h",
  LIMITED_MOVING_OPPORTUNITIES = "limitedMovingOpportunities",
  LONG_TEXTS = "longTexts",
  TEXTS_WITH_NO_RECORDINGS = "textWithNoRecordings",
  REQUIRES_DEXTERITY = "requiresDexterity",
  REQUIRES_QUICK_REACTIONS = "requiresQuickReactions",
}

export enum SignupType {
  KONSTI = "konsti",
  NONE = "none",
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
  styles: z.array(z.nativeEnum(GameStyle)),
  languages: z.array(z.nativeEnum(Language)),
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
