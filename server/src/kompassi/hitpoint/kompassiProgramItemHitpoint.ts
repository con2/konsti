import { z } from "zod";

export enum KompassiProgramTypeHitpoint {
  TABLETOP_RPG = "Roolipeli",
  LARP = "Larp",
}

export enum KompassiPhysicalPlayHitpoint {
  SOME = "some",
  LOTS = "lots",
}

export const KompassiProgramItemSchemaHitpoint = z.object({
  slug: z.string(),
  title: z.string().catch(""),
  description: z.string().catch(""),
  category_title: z.nativeEnum(KompassiProgramTypeHitpoint),
  formatted_hosts: z.string().catch(""),
  room_name: z.string().catch(""),
  length: z.number().catch(0),
  start_time: z.string().datetime(),
  min_players: z.number().catch(0),
  max_players: z.number().catch(0),
  three_word_description: z.string().catch(""),
  physical_play: z.nativeEnum(KompassiPhysicalPlayHitpoint),
  other_author: z.string().catch(""),
  rpg_system: z.string().catch(""),
  is_english_ok: z.boolean().catch(false),
  is_age_restricted: z.boolean().catch(false),
  is_beginner_friendly: z.boolean().catch(false),
  is_children_friendly: z.boolean().catch(false),
  is_intended_for_experienced_participants: z.boolean().catch(false),
  is_public: z.boolean().catch(false),
  video_link: z.string().catch(""),
});

export type KompassiProgramItemHitpoint = z.infer<
  typeof KompassiProgramItemSchemaHitpoint
>;
