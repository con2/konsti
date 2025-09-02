import { z } from "zod";
import { config } from "shared/config";
import { safeEnumArray } from "server/utils/zodUtils";

export enum KompassiKonstiProgramType {
  TABLETOP_RPG = "tabletoprpg",
  LARP = "larp",
  TOURNAMENT = "tournament",
  WORKSHOP = "workshop",
  EXPERIENCE_POINT = "experiencepoint",
  OTHER = "other",
  FLEAMARKET = "fleamarket",
  ROUNDTABLE_DISCUSSION = "roundtableDiscussion",
}

export enum KompassiGamestyle {
  LIGHT = "light",
  RULES_LIGHT = "rules-light",
  STORY_DRIVEN = "story-driven",
  SERIOUS = "serious",
  COMBAT_HEAVY = "combat-heavy",
  RULES_HEAVY = "rules-heavy",
  CHARACTER_DRIVEN = "character-driven",
}

export enum KompassiLanguage {
  FINNISH = "fi",
  ENGLISH = "en",
  SWEDISH = "sv",
  LANGUAGE_FREE = "free",
}

export enum KompassiInclusivity {
  COLOR_BLINDNESS = "color-blindness",
  FINGERS = "fingers",
  LOUD_SOUNDS = "loud-sounds",
  PHYSICAL_CONTACT = "physical-contact",
  LONG_PROGRAM = "long-program",
  NOT_AMPLIFIED = "not-amplified",
  NO_RECORDING_OR_SPOKEN_TEXT = "no-recordings-or-spoken-text",
  DARK_LIGHTING = "dark-lighting",
  NO_MOVEMENT = "no-movement",
  NO_TEXT_OF_RECORDING = "no-text-of-recording",
  LONG_TEXTS = "long-texts",
  LOTS_OF_MOVEMENT = "lots-of-movement",
  FLASHING_LIGHTS = "flahing-lights",
  QUICK_REACTIONS = "quick-reactions",
  NO_SUBTITLES = "no-subtitles",
  STRONG_ODOURS = "strong-odours",
  IRRITATING_CHEMICALS = "irritating-chemicals",
}

export enum KompassiGrouping {
  BEGINNERS = "beginners",
  NEW_WORLDS = "new-worlds",
  LGBT = "lgbt",
  GOH = "goh-program",
}

export enum KompassiAgeGroup {
  EVERYONE = "everyone",
  ADULTS = "adults",
  TEENS = "teens",
  ONLY_ADULTS = "only-adults",
  KIDS = "kids",
  SMALL_KIDS = "small-kids",
}

export enum KompassiRegistration {
  OTHER = "other",
  NOT_REQUIRED = "not-required",
  KONSTI = "konsti",
  EXPERIENCE_POINT = "experience-point",
  ROPE_LARP_DESK = "ropelarp",
  GAMEPOINT = "gamepoint",
}

export enum KompassiBoolean {
  TRUE = "true",
  FALSE = "false",
}

const ScheduleItemSchema = z.object({
  slug: z.string(),
  title: z.string().catch(""),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  lengthMinutes: z.number().catch(0),
  location: z.string().catch(""),
  isCancelled: z.boolean().catch(true),
  cachedAnnotations: z.object({
    "konsti:maxAttendance": z.number().catch(0),
  }),
});

export type KompassiScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const KompassiProgramItemSchema = z.object({
  slug: z.string(),
  title: z.string().catch(""),
  description: z.string().catch(""),
  cachedHosts: z.string().catch(""),
  isCancelled: z.boolean().catch(true),
  cachedDimensions: z.object({
    konsti: safeEnumArray(KompassiKonstiProgramType, "Konsti program type"),
    grouping: safeEnumArray(KompassiGrouping, "grouping"),
    language: safeEnumArray(KompassiLanguage, "language", [
      KompassiLanguage.FINNISH,
    ]),
    ["age-group"]: safeEnumArray(KompassiAgeGroup, "age group"),
    ["game-style"]: safeEnumArray(KompassiGamestyle, "gamestyle"),
    inclusivity: safeEnumArray(KompassiInclusivity, "inclusivity"),
    registration: safeEnumArray(KompassiRegistration, "registration"),
    revolvingdoor: safeEnumArray(KompassiBoolean, "revolving door"),
    room: z.array(z.string()).catch([]),
  }),
  cachedAnnotations: z.object({
    "konsti:rpgSystem": z.string().catch(""),
    "ropecon:otherAuthor": z.string().catch(""),
    "konsti:minAttendance": z.number().catch(1),
    "konsti:isPlaceholder": z.boolean().catch(false),
    "ropecon:numCharacters": z.number().catch(0),
    "konsti:workshopFee": z
      .string()
      .transform((val) => {
        if (val === "0€") {
          return "";
        }
        return val;
      })
      .catch(""),
    "konsti:entryConditionK16": z.boolean().catch(false),
    "ropecon:contentWarnings": z.string().catch(""),
    "ropecon:accessibilityOther": z.string().catch(""),
    "ropecon:gameSlogan": z.string().catch(""),
    "ropecon:isRevolvingDoor": z.boolean().catch(false),
  }),
  scheduleItems: z
    .array(ScheduleItemSchema)
    .min(config.server().logMissingScheduleItems ? 1 : 0),
});

export type KompassiProgramItem = z.infer<typeof KompassiProgramItemSchema>;
