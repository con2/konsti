/* eslint-disable unicorn/catch-error-name */

import { z } from "zod";
import { partition } from "remeda";
import { logger } from "server/utils/logger";
import { config } from "shared/config";

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
});

export type KompassiScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const KompassiProgramItemSchema = z.object({
  slug: z.string(),
  title: z.string().catch(""),
  description: z.string().catch(""),
  cachedHosts: z.string().catch(""),
  isCancelled: z.boolean().catch(true),
  cachedDimensions: z.object({
    konsti: z.array(z.nativeEnum(KompassiKonstiProgramType)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (konstiProgramType) =>
        Object.values(KompassiKonstiProgramType).includes(konstiProgramType),
      );
      logger.error(
        "%s",
        new Error(`Invalid Konsti program type: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    grouping: z.array(z.nativeEnum(KompassiGrouping)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (grouping) =>
        Object.values(KompassiGrouping).includes(grouping),
      );
      logger.error(
        "%s",
        new Error(`Invalid grouping: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    language: z.array(z.nativeEnum(KompassiLanguage)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [KompassiLanguage.FINNISH];
      }
      const [valid, invalid] = partition(ctx.input, (language) =>
        Object.values(KompassiLanguage).includes(language),
      );
      logger.error(
        "%s",
        new Error(`Invalid language: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    ["age-group"]: z.array(z.nativeEnum(KompassiAgeGroup)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (ageGroup) =>
        Object.values(KompassiAgeGroup).includes(ageGroup),
      );
      logger.error(
        "%s",
        new Error(`Invalid age group: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    ["game-style"]: z.array(z.nativeEnum(KompassiGamestyle)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (gamestyle) =>
        Object.values(KompassiGamestyle).includes(gamestyle),
      );
      logger.error(
        "%s",
        new Error(`Invalid gamestyle: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    inclusivity: z.array(z.nativeEnum(KompassiInclusivity)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (inclusivity) =>
        Object.values(KompassiInclusivity).includes(inclusivity),
      );
      logger.error(
        "%s",
        new Error(`Invalid inclusivity: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    registration: z.array(z.nativeEnum(KompassiRegistration)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (registration) =>
        Object.values(KompassiRegistration).includes(registration),
      );
      logger.error(
        "%s",
        new Error(`Invalid registration: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    revolvingdoor: z.array(z.nativeEnum(KompassiBoolean)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (revolvingDoor) =>
        Object.values(KompassiBoolean).includes(revolvingDoor),
      );
      logger.error(
        "%s",
        new Error(`Invalid revolving door: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
  }),
  cachedAnnotations: z.object({
    "konsti:rpgSystem": z.string().catch(""),
    "ropecon:otherAuthor": z.string().catch(""),
    "konsti:minAttendance": z.number().catch(1),
    "konsti:maxAttendance": z.number().catch(0),
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
    "ropecon:contentWarnings": z.string().catch(""),
    "ropecon:accessibilityOther": z.string().catch(""),
    "ropecon:gameSlogan": z.string().catch(""),
    "ropecon:isRevolvingDoor": z.boolean().catch(false),
  }),
  scheduleItems: z
    .array(ScheduleItemSchema)
    .min(config.event().logMissingScheduleItems ? 1 : 0),
});

export type KompassiProgramItem = z.infer<typeof KompassiProgramItemSchema>;

/* eslint-enable unicorn/catch-error-name */
