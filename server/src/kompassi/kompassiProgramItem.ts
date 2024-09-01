import { z } from "zod";
import { partition } from "lodash-es";
import { logger } from "server/utils/logger";

export enum KompassiTopic {
  BOFFERIN = "boffering",
  MINIATURES = "miniatures",
  THEME = "theme",
  CARDGAMES = "cardgames",
  CRAFTS = "crafts",
  BOARDGAMES = "boardgames",
  PENANDPAPER = "penandpaper",
  DANCE = "dance",
  LARP = "larp",
  MUSIC = "music",
  GOH = "goh",
}

export enum KompassiKonstiProgramType {
  TABLETOP_RPG = "tabletopRPG",
  LARP = "larp",
  TOURNAMENT = "tournament",
  WORKSHOP = "workshop",
  EXPERIENCE_POINT = "experiencePoint",
  OTHER = "other",
  FLEAMARKET = "fleamarket",
  ROUNDTABLE_DISCUSSION = "roundtableDiscussion",
}

export enum KompassiAudience {
  AIMED_UNDER_13 = "aimed-under-13",
  BEGINNERS = "beginners",
  ALL_AGES = "all-ages",
  AIMED_BETWEEN_13_17 = "aimed-between-13-17",
  AIMED_ADULTS = "aimed-adults",
  K_18 = "k-18",
  UNRESTRICTED = "unrestricted",
  BEGINNER_FRIENDLY = "beginner-friendly",
  EXPERIENCED = "experienced",
  R18 = "r18",
  CHILD_FRIENDLY = "child-friendly",
}

export enum KompassiPlaystyle {
  SERIOUS = "serious",
  LIGHT = "light",
  RULES_HEAVY = "rules-heavy",
  RULES_LIGHT = "rules-light",
  STORY_DRIVEN = "story-driven",
  CHARACTER_DRIVEN = "character-driven",
  COMBAT_DRIVEN = "combat-driven",
}

export enum KompassiLanguage {
  FINNISH = "fi",
  ENGLISH = "en",
  SWEDISH = "sv",
  LANGUAGE_FREE = "free",
}

export enum KompassiAccessibility {
  LOUD_SOUNDS = "loud-sounds",
  PHYSICAL_CONTACT = "physical-contact",
  MOVING_AROUND = "moving-around",
  DURATION_OVER_2H = "duration-over-2h",
  REQUIRES_DEXTERITY = "requires-dexterity",
  RECORDING = "recording",
  REQUIRES_QUICK_REACTIONS = "requires-quick-reactions",
  COLORBLIND = "colorblind",
  TEXTS_WITH_NO_RECORDINGS = "texts-with-no-recordings",
  LIMITED_MOVING_OPPORTUNITIES = "limited-moving-opportunities",
  FLASHING_LIGHTS = "flashing-lights",
  LOW_LIGHTING = "low-lighting",
  LONG_TEXTS = "long-texts",
  IRRITATE_SKIN = "irritate-skin",
  VIDEO = "video",
  STRONG_SMELLS = "strong-smells",
}

export const KompassiProgramItemSchema = z.object({
  slug: z.string(),
  title: z.string().catch(""),
  description: z.string().catch(""),
  cachedHosts: z.string().catch(""),
  cachedDimensions: z.object({
    date: z.array(z.string()).catch([]),
    room: z.array(z.string()).catch([]),
    type: z.array(z.string()).catch([]),
    topic: z.array(z.nativeEnum(KompassiTopic)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (topic) =>
        Object.values(KompassiTopic).includes(topic),
      );
      logger.error(
        "%s",
        new Error(`Invalid topic: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    konsti: z.array(z.nativeEnum(KompassiKonstiProgramType)).catch([]),
    audience: z.array(z.nativeEnum(KompassiAudience)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (audience) =>
        Object.values(KompassiAudience).includes(audience),
      );
      logger.error(
        "%s",
        new Error(`Invalid audience: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    language: z.array(z.nativeEnum(KompassiLanguage)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
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
    accessibility: z.array(z.nativeEnum(KompassiAccessibility)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (accessibility) =>
        Object.values(KompassiAccessibility).includes(accessibility),
      );
      logger.error(
        "%s",
        new Error(`Invalid accessibility: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
    playstyle: z.array(z.nativeEnum(KompassiPlaystyle)).catch((ctx) => {
      if (!Array.isArray(ctx.input)) {
        return [];
      }
      const [valid, invalid] = partition(ctx.input, (playstyle) =>
        Object.values(KompassiPlaystyle).includes(playstyle),
      );
      logger.error(
        "%s",
        new Error(`Invalid playstyle: ${JSON.stringify(invalid)}`),
      );
      return valid;
    }),
  }),
  scheduleItems: z
    .array(
      z.object({
        slug: z.string(),
        title: z.string().catch(""),
        startTime: z.string().datetime({ offset: true }),
        endTime: z.string().datetime({ offset: true }),
        lengthMinutes: z.number().catch(0),
        location: z.string().catch(""),
      }),
    )
    .min(1),
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
});

export type KompassiProgramItem = z.infer<typeof KompassiProgramItemSchema>;
