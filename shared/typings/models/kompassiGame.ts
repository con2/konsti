import { z } from "zod";

export enum KompassiProgramType {
  TABLETOP_RPG = "Roolipeli / Pen & Paper RPG",
  LARP = "LARP",
  BOARD_GAME = "Pelitiski: Lautapeli / Board game",
  CARD_GAME = "Pelitiski: Korttipeli / Card game",
  MINIATURE_WARGAME = "Pelitiski: Figupeli / Miniature wargame",
  OTHER = "Pelitiski: Muu / Other",
  WORKSHOP_MINIATURE = "Työpaja: figut / Workshop: miniature figurines",
  WORKSHOP_CRAFTS = "Työpaja: käsityö / Workshop: crafts",
  WORKSHOP_MUSIC = "Työpaja: musiikki / Workshop: music",
  WORKSHOP_OTHER = "Työpaja: muu / Other workshop",
}

export const tournamentProgramTypes = [
  KompassiProgramType.BOARD_GAME,
  KompassiProgramType.CARD_GAME,
  KompassiProgramType.MINIATURE_WARGAME,
  KompassiProgramType.OTHER,
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

export const KompassiGameSchema = z
  .object({
    identifier: z.string(),
    title: z.string().catch(""),
    description: z.string().catch(""),
    category_title: z.nativeEnum(KompassiProgramType),
    formatted_hosts: z.string().catch(""),
    room_name: z.string().catch(""),
    length: z.number().catch(0),
    start_time: z.string().datetime().catch(""),
    end_time: z.string().datetime().catch(""),
    language: z.string().catch(""),
    rpg_system: z.string().catch(""),
    min_players: z.number().catch(0),
    max_players: z.number().catch(0),
    tags: z.array(z.nativeEnum(KompassiTag)).catch([]),
    genres: z.array(z.nativeEnum(KompassiGenre)).catch([]),
    styles: z.array(z.nativeEnum(KompassiGameStyle)).catch([]),
    short_blurb: z.string().catch(""),
    revolving_door: z.boolean().catch(false),
    content_warnings: z.string().catch(""),
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
    ropecon2021_accessibility_text: z.boolean().catch(false),
    ropecon2021_accessibility_colourblind: z.boolean().catch(false),
    ropecon2022_accessibility_remaining_one_place: z.boolean().catch(false),
    ropecon2022_content_warnings: z.string().catch(""),
    ropecon2021_accessibility_inaccessibility: z.string().catch(""),
    type_of_game_program: z.string().catch(""),
    entry_fee: z.number().catch(0),
  })
  .strict();

export type KompassiGame = z.infer<typeof KompassiGameSchema>;
