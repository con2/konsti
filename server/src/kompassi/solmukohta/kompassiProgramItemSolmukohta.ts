import { z } from "zod";
import { partition } from "lodash-es";
import { logger } from "server/utils/logger";

export enum KompassiProgramTypeSolmukohta {
  LARP = "Larp",
  WORKSHOP = "Workshop",
  ROUNDTABLE_DISCUSSION = "Roundtable discussion",
}

export enum KompassiTagSolmukohta {
  FIRST_TIME_RECOMMENDED = "sk-firsttime-recommended",
  ADVANCE_SIGNUP = "sk-advance-signup",
}

export const KompassiProgramItemSchemaSolmukohta = z.object({
  identifier: z.string(),
  title: z.string().catch(""),
  description: z.string().catch(""),
  category_title: z.nativeEnum(KompassiProgramTypeSolmukohta),
  formatted_hosts: z.string().catch(""),
  room_name: z.string().catch(""),
  length: z.number().catch(0),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  rpg_system: z.string().catch(""),
  min_players: z.number().catch(0),
  max_players: z.number().catch(0),
  tags: z.array(z.nativeEnum(KompassiTagSolmukohta)).catch((ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!ctx.input || !Array.isArray(ctx.input)) {
      return [];
    }
    const [valid, invalid] = partition(ctx.input, (tag) =>
      Object.values(KompassiTagSolmukohta).includes(tag),
    );
    logger.error("%s", new Error(`Invalid tags: ${JSON.stringify(invalid)}`));
    return valid;
  }),
  styles: z.array(z.string()),
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
  ropecon2023_signuplist: z.null(),
  ropecon2023_workshop_fee: z.string().catch(""),
  ropecon2023_language: z.string(),
  ropecon2023_suitable_for_all_ages: z.boolean().catch(false),
  ropecon2023_aimed_at_children_under_13: z.boolean().catch(false),
  ropecon2023_aimed_at_children_between_13_17: z.boolean().catch(false),
  ropecon2023_aimed_at_adult_attendees: z.boolean().catch(false),
  ropecon2023_for_18_plus_only: z.boolean().catch(false),
  ropecon2023_beginner_friendly: z.boolean().catch(false),
  ropecon_theme: z.boolean().catch(false),
  ropecon2023_celebratory_year: z.boolean().catch(false),
});

export type KompassiProgramItemSolmukohta = z.infer<
  typeof KompassiProgramItemSchemaSolmukohta
>;
