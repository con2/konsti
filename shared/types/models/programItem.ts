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
  FINNISH_OR_ENGLISH = "finnishOrEnglish",
  LANGUAGE_FREE = "languageFree",
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
  SUITABLE_FOR_ALL_AGES = "suitableForAllAges",
  AIMED_AT_CHILDREN_UNDER_13 = "aimedAtChildrenUnder13",
  AIMED_AT_CHILDREN_BETWEEN_13_17 = "aimedAtChildrenBetween13to17",
  AIMED_AT_ADULT_ATTENDEES = "aimedAtAdultAttendees",
  FOR_18_PLUS_ONLY = "for18PlusOnly",
  ROPECON_THEME = "ropeconTheme",
  CELEBRATORY_YEAR = "celebratoryYear",
  INTENDED_FOR_EXPERIENCED_PARTICIPANTS = "intendedForExperiencedParticipants",
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
  signupType: z.string(),
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
