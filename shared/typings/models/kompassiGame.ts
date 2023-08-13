import { z } from "zod";
import _ from "lodash";
import { logger } from "server/utils/logger";

export enum KompassiProgramType {
  TABLETOP_RPG = "Roolipeli / Pen & Paper RPG",
  LARP = "LARP",
  TOURNAMENT_BOARD_GAME = "Turnaukset: lautapelit / Tournament: Board games",
  TOURNAMENT_CARD_GAME = "Turnaukset: korttipelit / Tournament: Card games",
  TOURNAMENT_MINIATURE_WARGAME = "Turnaukset: figupelit / Tournament: Miniature wargames",
  TOURNAMENT_OTHER = "Turnaukset: muu / Tournament: Other",
  WORKSHOP_MINIATURE = "Työpaja: figut / Workshop: miniature figurines",
  WORKSHOP_CRAFTS = "Työpaja: käsityö / Workshop: crafts",
  WORKSHOP_MUSIC = "Työpaja: musiikki / Workshop: music",
  WORKSHOP_OTHER = "Työpaja: muu / Workshop: other",
  EXPERIENCE_POINT_DEMO = "Kokemuspiste: demotus / Experience Point: Demo game",
  EXPERIENCE_POINT_OTHER = "Kokemuspiste: muu / Experience Point: Other",
  EXPERIENCE_POINT_OPEN = "Kokemuspiste: avoin pelautus / Experience Point: Open game",
  OTHER_GAME_PROGRAM = "Muu peliohjelma / Other game programme",
  OTHER_PROGRAM = "Muu ohjelma / None of the above",
  MINIATURE_DEMO = "Figupelit: demotus / Miniature wargames: Demo game",
}

export const experiencePointAndOtherProgramTypes = [
  KompassiProgramType.EXPERIENCE_POINT_DEMO,
  KompassiProgramType.EXPERIENCE_POINT_OTHER,
  KompassiProgramType.EXPERIENCE_POINT_OPEN,
  KompassiProgramType.OTHER_GAME_PROGRAM,
  KompassiProgramType.OTHER_PROGRAM,
  KompassiProgramType.MINIATURE_DEMO,
];

export const tournamentProgramTypes = [
  KompassiProgramType.TOURNAMENT_BOARD_GAME,
  KompassiProgramType.TOURNAMENT_CARD_GAME,
  KompassiProgramType.TOURNAMENT_MINIATURE_WARGAME,
  KompassiProgramType.TOURNAMENT_OTHER,
];

export const workshopProgramTypes = [
  KompassiProgramType.WORKSHOP_CRAFTS,
  KompassiProgramType.WORKSHOP_MINIATURE,
  KompassiProgramType.WORKSHOP_MUSIC,
  KompassiProgramType.WORKSHOP_OTHER,
];

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
  SUUNNATTU_ALLE_10V = "suunnattu-alle-10-vuotiaille",
  SUUNNATTU_ALAIKAISILLE = "suunnattu-alaikaisille",
  SUUNNATTU_TAYSIIKAISILLE = "suunnattu-taysi-ikaisille",
  TEEMA_YSTAVYYS = "teema-ystavyys",
  DEMO = "demo",
  KILPAILUTURNAUS = "kilpailuturnaus",
  HISTORIA = "historia",
  AIHE_FIGUPELIT = "aihe-figupelit",
  AIHE_KORTTIPELIT = "aihe-korttipelit",
  AIHE_LARPIT = "aihe-larpit",
  AIHE_LAUTAPELIT = "aihe-lautapelit",
  AIHE_POYTAROOLIPELIT = "aihe-poytaroolipelit",
  PELI = "peli",
  YOUTUBE = "youtube",
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

export enum KompassiSignupType {
  NONE = "none",
  KONSTI = "konsti",
  OTHER = "othersign",
}

export enum KompassiLanguage {
  FINNISH = "finnish",
  ENGLISH = "english",
  FINNISH_OR_ENGLISH = "finnish_or_english",
  LANGUAGE_FREE = "language_free",
}

export const KompassiGameSchema = z.object({
  identifier: z.string(),
  title: z.string().catch(""),
  description: z.string().catch(""),
  category_title: z.nativeEnum(KompassiProgramType),
  formatted_hosts: z.string().catch(""),
  room_name: z.string().catch(""),
  length: z.number().catch(0),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  rpg_system: z.string().catch(""),
  min_players: z.number().catch(0),
  max_players: z.number().catch(0),

  tags: z.array(z.nativeEnum(KompassiTag)).catch((ctx) => {
    if (!ctx.input || !Array.isArray(ctx.input)) {
      return [];
    }
    const [valid, invalid] = _.partition(ctx.input, (tag) =>
      Object.values(KompassiTag).includes(tag),
    );
    logger.error("%s", new Error(`Invalid tags: ${JSON.stringify(invalid)}`));
    return valid;
  }),

  genres: z.array(z.nativeEnum(KompassiGenre)).catch((ctx) => {
    if (!ctx.input || !Array.isArray(ctx.input)) {
      return [];
    }
    const [valid, invalid] = _.partition(ctx.input, (genre) =>
      Object.values(KompassiGenre).includes(genre),
    );
    logger.error("%s", new Error(`Invalid genres: ${JSON.stringify(invalid)}`));
    return valid;
  }),

  styles: z.array(z.nativeEnum(KompassiGameStyle)).catch((ctx) => {
    if (!ctx.input || !Array.isArray(ctx.input)) {
      return [];
    }
    const [valid, invalid] = _.partition(ctx.input, (style) =>
      Object.values(KompassiGameStyle).includes(style),
    );
    logger.error("%s", new Error(`Invalid styles: ${JSON.stringify(invalid)}`));
    return valid;
  }),

  short_blurb: z.string().catch(""),
  revolving_door: z.boolean().catch(false),
  other_author: z.string().catch(""),
  ropecon2018_characters: z.number().catch(0),
  ropecon2021_accessibility_loud_sounds: z.boolean().catch(false),
  ropecon2021_accessibility_flashing_lights: z.boolean().catch(false),
  ropecon2021_accessibility_strong_smells: z.boolean().catch(false),
  ropecon2021_accessibility_irritate_skin: z.boolean().catch(false),
  ropecon2021_accessibility_physical_contact: z.boolean().catch(false),
  ropecon2021_accessibility_low_lightning: z.boolean().catch(false),
  ropecon2021_accessibility_moving_around: z.boolean().catch(false),
  ropecon2021_accessibility_video: z.boolean().catch(false),
  ropecon2021_accessibility_recording: z.boolean().catch(false),
  ropecon2021_accessibility_colourblind: z.boolean().catch(false),
  ropecon2022_accessibility_remaining_one_place: z.boolean().catch(false),
  ropecon2022_content_warnings: z.string().catch(""),
  ropecon2023_accessibility_cant_use_mic: z.boolean().catch(false),
  ropecon2023_accessibility_programme_duration_over_2_hours: z
    .boolean()
    .catch(false),
  ropecon2023_accessibility_limited_opportunities_to_move_around: z
    .boolean()
    .catch(false),
  ropecon2023_accessibility_long_texts: z.boolean().catch(false),
  ropecon2023_accessibility_texts_not_available_as_recordings: z
    .boolean()
    .catch(false),
  ropecon2023_accessibility_participation_requires_dexterity: z
    .boolean()
    .catch(false),
  ropecon2023_accessibility_participation_requires_react_quickly: z
    .boolean()
    .catch(false),
  ropecon2023_other_accessibility_information: z.string().catch(""),
  ropecon2023_signuplist: z
    .nativeEnum(KompassiSignupType)
    .catch(KompassiSignupType.NONE), // Signup type: no signup, Konsti, other
  ropecon2023_workshop_fee: z
    .string()
    .transform((val) => {
      if (val === "0€") {
        return "";
      }
      return val;
    })
    .catch(""),
  ropecon2023_language: z.nativeEnum(KompassiLanguage),
  ropecon2023_suitable_for_all_ages: z.boolean().catch(false), // tag
  ropecon2023_aimed_at_children_under_13: z.boolean().catch(false), // tag
  ropecon2023_aimed_at_children_between_13_17: z.boolean().catch(false), // tag
  ropecon2023_aimed_at_adult_attendees: z.boolean().catch(false), // tag
  ropecon2023_for_18_plus_only: z.boolean().catch(false), // tag
  ropecon2023_beginner_friendly: z.boolean().catch(false), // tag
  ropecon_theme: z.boolean().catch(false), // tag
  ropecon2023_celebratory_year: z.boolean().catch(false), // tag
});

export type KompassiGame = z.infer<typeof KompassiGameSchema>;
