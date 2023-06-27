import { testGame, testGame2 } from "shared/tests/testGame";
import {
  KompassiGame,
  KompassiGameStyle,
  KompassiGenre,
  KompassiProgramType,
  KompassiTag,
} from "shared/typings/models/kompassiGame";

export const testKompassiGame: KompassiGame = {
  title: testGame.title,
  description: testGame.description,
  category_title: KompassiProgramType.TABLETOP_RPG,
  formatted_hosts: testGame.people,
  room_name: testGame.location,
  length: testGame.mins,
  start_time: testGame.startTime,
  end_time: testGame.endTime,
  rpg_system: testGame.gameSystem,
  min_players: testGame.minAttendance,
  max_players: testGame.maxAttendance,
  identifier: testGame.gameId,
  tags: [KompassiTag.ALOITTELIJAYSTÄVÄLLINEN, KompassiTag.SOPII_ALLE_7V],
  genres: [KompassiGenre.ADVENTURE, KompassiGenre.HUMOR],
  styles: [KompassiGameStyle.CHARACTER_DRIVEN, KompassiGameStyle.RULES_LIGHT],
  short_blurb: testGame.shortDescription,
  revolving_door: false,
  other_author: testGame.otherAuthor,
  ropecon2018_characters: testGame.maxAttendance,
  ropecon2021_accessibility_loud_sounds: false,
  ropecon2021_accessibility_flashing_lights: false,
  ropecon2021_accessibility_strong_smells: false,
  ropecon2021_accessibility_irritate_skin: false,
  ropecon2021_accessibility_physical_contact: false,
  ropecon2021_accessibility_low_lightning: false,
  ropecon2021_accessibility_moving_around: false,
  ropecon2021_accessibility_video: false,
  ropecon2021_accessibility_recording: false,
  ropecon2021_accessibility_text: false,
  ropecon2021_accessibility_colourblind: false,
  ropecon2022_accessibility_remaining_one_place: false,
  ropecon2022_content_warnings: testGame.contentWarnings,
  ropecon2023_accessibility_cant_use_mic: false,
  ropecon2023_accessibility_programme_duration_over_2_hours: false,
  ropecon2023_accessibility_limited_opportunities_to_move_around: false,
  ropecon2023_accessibility_long_texts: false,
  ropecon2023_accessibility_texts_not_available_as_recordings: false,
  ropecon2023_accessibility_participation_requires_dexterity: false,
  ropecon2023_accessibility_participation_requires_react_quickly: false,
  ropecon2023_other_accessibility_information:
    "Other accessibility information",
  ropecon2023_signuplist: "",
  ropecon2023_workshop_fee: 0,
  ropecon2023_language: testGame.language,
  ropecon2023_suitable_for_all_ages: false,
  ropecon2023_aimed_at_children_under_13: false,
  ropecon2023_aimed_at_children_between_13_17: false,
  ropecon2023_aimed_at_adult_attendees: false,
  ropecon2023_for_18_plus_only: false,
  ropecon2023_beginner_friendly: false,
  ropecon_theme: false,
  ropecon2023_celebratory_year: false,
};

export const testKompassiGame2: KompassiGame = {
  title: testGame2.title,
  description: testGame2.description,
  category_title: KompassiProgramType.TABLETOP_RPG,
  formatted_hosts: testGame2.people,
  room_name: testGame2.location,
  length: testGame2.mins,
  start_time: testGame2.startTime,
  end_time: testGame2.endTime,
  rpg_system: testGame2.gameSystem,
  min_players: testGame2.minAttendance,
  max_players: testGame2.maxAttendance,
  identifier: testGame2.gameId,
  tags: [KompassiTag.ALOITTELIJAYSTÄVÄLLINEN, KompassiTag.SOPII_ALLE_7V],
  genres: [KompassiGenre.ADVENTURE, KompassiGenre.HUMOR],
  styles: [KompassiGameStyle.CHARACTER_DRIVEN, KompassiGameStyle.RULES_LIGHT],
  short_blurb: testGame2.shortDescription,
  revolving_door: false,
  other_author: testGame2.otherAuthor,
  ropecon2018_characters: testGame2.maxAttendance,
  ropecon2021_accessibility_loud_sounds: false,
  ropecon2021_accessibility_flashing_lights: false,
  ropecon2021_accessibility_strong_smells: false,
  ropecon2021_accessibility_irritate_skin: false,
  ropecon2021_accessibility_physical_contact: false,
  ropecon2021_accessibility_low_lightning: false,
  ropecon2021_accessibility_moving_around: false,
  ropecon2021_accessibility_video: false,
  ropecon2021_accessibility_recording: false,
  ropecon2021_accessibility_text: false,
  ropecon2021_accessibility_colourblind: false,
  ropecon2022_accessibility_remaining_one_place: false,
  ropecon2022_content_warnings: testGame2.contentWarnings,
  ropecon2023_accessibility_cant_use_mic: false,
  ropecon2023_accessibility_programme_duration_over_2_hours: false,
  ropecon2023_accessibility_limited_opportunities_to_move_around: false,
  ropecon2023_accessibility_long_texts: false,
  ropecon2023_accessibility_texts_not_available_as_recordings: false,
  ropecon2023_accessibility_participation_requires_dexterity: false,
  ropecon2023_accessibility_participation_requires_react_quickly: false,
  ropecon2023_other_accessibility_information:
    "Other accessibility information",
  ropecon2023_signuplist: "",
  ropecon2023_workshop_fee: 0,
  ropecon2023_language: testGame2.language,
  ropecon2023_suitable_for_all_ages: false,
  ropecon2023_aimed_at_children_under_13: false,
  ropecon2023_aimed_at_children_between_13_17: false,
  ropecon2023_aimed_at_adult_attendees: false,
  ropecon2023_for_18_plus_only: false,
  ropecon2023_beginner_friendly: false,
  ropecon_theme: false,
  ropecon2023_celebratory_year: false,
};
