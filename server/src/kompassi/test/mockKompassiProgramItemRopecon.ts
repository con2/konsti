import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  KompassiProgramItemRopecon,
  KompassiGameStyleRopecon,
  KompassiGenreRopecon,
  KompassiLanguageRopecon,
  KompassiProgramTypeRopecon,
  KompassiSignupTypeRopecon,
  KompassiTagRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";

export const mockKompassiProgramItemRopecon: KompassiProgramItemRopecon = {
  title: testProgramItem.title,
  description: testProgramItem.description,
  category_title: KompassiProgramTypeRopecon.TABLETOP_RPG,
  formatted_hosts: testProgramItem.people,
  room_name: testProgramItem.location,
  length: testProgramItem.mins,
  start_time: testProgramItem.startTime,
  end_time: testProgramItem.endTime,
  rpg_system: testProgramItem.gameSystem,
  min_players: testProgramItem.minAttendance,
  max_players: testProgramItem.maxAttendance,
  identifier: testProgramItem.programItemId,
  tags: [
    KompassiTagRopecon.ALOITTELIJAYSTÄVÄLLINEN,
    KompassiTagRopecon.SOPII_ALLE_7V,
  ],
  genres: [KompassiGenreRopecon.ADVENTURE, KompassiGenreRopecon.HUMOR],
  styles: [
    KompassiGameStyleRopecon.CHARACTER_DRIVEN,
    KompassiGameStyleRopecon.RULES_LIGHT,
  ],
  short_blurb: testProgramItem.shortDescription,
  revolving_door: false,
  other_author: testProgramItem.otherAuthor,
  ropecon2018_characters: testProgramItem.maxAttendance,
  ropecon2021_accessibility_loud_sounds: false,
  ropecon2021_accessibility_flashing_lights: false,
  ropecon2021_accessibility_strong_smells: false,
  ropecon2021_accessibility_irritate_skin: false,
  ropecon2021_accessibility_physical_contact: false,
  ropecon2021_accessibility_low_lightning: false,
  ropecon2021_accessibility_moving_around: false,
  ropecon2021_accessibility_video: false,
  ropecon2021_accessibility_recording: false,
  ropecon2021_accessibility_colourblind: false,
  ropecon2022_accessibility_remaining_one_place: false,
  ropecon2022_content_warnings: testProgramItem.contentWarnings,
  ropecon2023_accessibility_cant_use_mic: false,
  ropecon2023_accessibility_programme_duration_over_2_hours: false,
  ropecon2023_accessibility_limited_opportunities_to_move_around: false,
  ropecon2023_accessibility_long_texts: false,
  ropecon2023_accessibility_texts_not_available_as_recordings: false,
  ropecon2023_accessibility_participation_requires_dexterity: false,
  ropecon2023_accessibility_participation_requires_react_quickly: false,
  ropecon2023_other_accessibility_information:
    "Other accessibility information",
  ropecon2023_signuplist: KompassiSignupTypeRopecon.KONSTI,
  ropecon2023_workshop_fee: "",
  ropecon2023_language: KompassiLanguageRopecon.FINNISH,
  ropecon2023_suitable_for_all_ages: false,
  ropecon2023_aimed_at_children_under_13: false,
  ropecon2023_aimed_at_children_between_13_17: false,
  ropecon2023_aimed_at_adult_attendees: false,
  ropecon2023_for_18_plus_only: false,
  ropecon2023_beginner_friendly: false,
  ropecon_theme: false,
  ropecon2023_celebratory_year: false,
};

export const mockKompassiProgramItemRopecon2: KompassiProgramItemRopecon = {
  title: testProgramItem2.title,
  description: testProgramItem2.description,
  category_title: KompassiProgramTypeRopecon.TABLETOP_RPG,
  formatted_hosts: testProgramItem2.people,
  room_name: testProgramItem2.location,
  length: testProgramItem2.mins,
  start_time: testProgramItem2.startTime,
  end_time: testProgramItem2.endTime,
  rpg_system: testProgramItem2.gameSystem,
  min_players: testProgramItem2.minAttendance,
  max_players: testProgramItem2.maxAttendance,
  identifier: testProgramItem2.programItemId,
  tags: [
    KompassiTagRopecon.ALOITTELIJAYSTÄVÄLLINEN,
    KompassiTagRopecon.SOPII_ALLE_7V,
  ],
  genres: [KompassiGenreRopecon.ADVENTURE, KompassiGenreRopecon.HUMOR],
  styles: [
    KompassiGameStyleRopecon.CHARACTER_DRIVEN,
    KompassiGameStyleRopecon.RULES_LIGHT,
  ],
  short_blurb: testProgramItem2.shortDescription,
  revolving_door: false,
  other_author: testProgramItem2.otherAuthor,
  ropecon2018_characters: testProgramItem2.maxAttendance,
  ropecon2021_accessibility_loud_sounds: false,
  ropecon2021_accessibility_flashing_lights: false,
  ropecon2021_accessibility_strong_smells: false,
  ropecon2021_accessibility_irritate_skin: false,
  ropecon2021_accessibility_physical_contact: false,
  ropecon2021_accessibility_low_lightning: false,
  ropecon2021_accessibility_moving_around: false,
  ropecon2021_accessibility_video: false,
  ropecon2021_accessibility_recording: false,
  ropecon2021_accessibility_colourblind: false,
  ropecon2022_accessibility_remaining_one_place: false,
  ropecon2022_content_warnings: testProgramItem2.contentWarnings,
  ropecon2023_accessibility_cant_use_mic: false,
  ropecon2023_accessibility_programme_duration_over_2_hours: false,
  ropecon2023_accessibility_limited_opportunities_to_move_around: false,
  ropecon2023_accessibility_long_texts: false,
  ropecon2023_accessibility_texts_not_available_as_recordings: false,
  ropecon2023_accessibility_participation_requires_dexterity: false,
  ropecon2023_accessibility_participation_requires_react_quickly: false,
  ropecon2023_other_accessibility_information:
    "Other accessibility information",
  ropecon2023_signuplist: KompassiSignupTypeRopecon.KONSTI,
  ropecon2023_workshop_fee: "",
  ropecon2023_language: KompassiLanguageRopecon.FINNISH,
  ropecon2023_suitable_for_all_ages: false,
  ropecon2023_aimed_at_children_under_13: false,
  ropecon2023_aimed_at_children_between_13_17: false,
  ropecon2023_aimed_at_adult_attendees: false,
  ropecon2023_for_18_plus_only: false,
  ropecon2023_beginner_friendly: false,
  ropecon_theme: false,
  ropecon2023_celebratory_year: false,
};