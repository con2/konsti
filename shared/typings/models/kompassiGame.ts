import { z } from "zod";

export enum KompassiProgramType {
  TABLETOP_RPG = "Roolipeli / Pen & Paper RPG",
  FREEFORM_RPG = "Freeform",
  LARP = "LARP",
}

export enum KompassiTag {
  IN_ENGLISH = "in-english",
  SOPII_LAPSILLE = "sopii-lapsille",
  VAIN_TAYSI_IKAISILLE = "vain-taysi-ikaisille",
  ALOITTELIJAYSTÄVÄLLINEN = "aloittelijaystavallinen",
  KUNNIAVIERAS = "kunniavieras",
  PERHEOHJELMA = "perheohjelma",
  TEEMA_ELEMENTIT = "teema-elementit",
  SOPII_ALLE_7V = "sopii-alle-7v-",
  SOPII_7_12V = "sopii-7-12v-",
  SOPII_YLI_12V = "sopii-yli-12v-",
  EI_SOVELLU_ALLE_15V = "ei-sovellu-alle-15v-",
  LASTENOHJELMA = "lastenohjelma",
}

export enum KompassiGenre {
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

export enum KompassiGameStyle {
  SERIOUS = "serious",
  LIGHT = "light",
  RULES_HEAVY = "rules_heavy",
  RULES_LIGHT = "rules_light",
  STORY_DRIVEN = "story_driven",
  CHARACTER_DRIVEN = "character_driven",
  COMBAT_DRIVEN = "combat_driven",
}

const KompassiGameSchema = z.object({
  title: z.string(),
  description: z.string(),
  category_title: z.nativeEnum(KompassiProgramType),
  formatted_hosts: z.string(),
  room_name: z.string(),
  length: z.number(),
  start_time: z.string(),
  end_time: z.string(),
  language: z.string(),
  rpg_system: z.string(),
  no_language: z.boolean(),
  english_ok: z.boolean(),
  children_friendly: z.boolean(),
  age_restricted: z.boolean(),
  beginner_friendly: z.boolean(),
  intended_for_experienced_participants: z.boolean(),
  min_players: z.number(),
  max_players: z.number(),
  identifier: z.string(),
  tags: z.array(z.nativeEnum(KompassiTag)).default([]),
  genres: z.array(z.nativeEnum(KompassiGenre)).default([]),
  styles: z.array(z.nativeEnum(KompassiGameStyle)).default([]),
  short_blurb: z.string(),
  revolving_door: z.boolean(),
  three_word_description: z.string(),
  is_beginner_friendly: z.boolean(),
  content_warnings: z.string(),
  other_author: z.string(),
  ropecon2018_characters: z.number(),
  ropecon2021_accessibility_loud_sounds: z.boolean(),
  ropecon2021_accessibility_flashing_lights: z.boolean(),
  ropecon2021_accessibility_strong_smells: z.boolean(),
  ropecon2021_accessibility_irritate_skin: z.boolean(),
  ropecon2021_accessibility_physical_contact: z.boolean(),
  ropecon2021_accessibility_low_lightning: z.boolean(),
  ropecon2021_accessibility_moving_around: z.boolean(),
  ropecon2021_accessibility_video: z.boolean(),
  ropecon2021_accessibility_recording: z.boolean(),
  ropecon2021_accessibility_text: z.boolean(),
  ropecon2021_accessibility_colourblind: z.boolean(),
});

export type KompassiGame = z.infer<typeof KompassiGameSchema>;
