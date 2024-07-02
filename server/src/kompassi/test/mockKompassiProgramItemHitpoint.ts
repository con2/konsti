import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  KompassiProgramItemHitpoint,
  KompassiPhysicalPlayHitpoint,
  KompassiProgramTypeHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";

export const mockKompassiProgramItemHitpoint: KompassiProgramItemHitpoint = {
  title: testProgramItem.title,
  description: testProgramItem.description,
  category_title: KompassiProgramTypeHitpoint.TABLETOP_RPG,
  formatted_hosts: testProgramItem.people,
  room_name: testProgramItem.location,
  length: testProgramItem.mins,
  start_time: testProgramItem.startTime,
  rpg_system: testProgramItem.gameSystem,
  min_players: testProgramItem.minAttendance,
  max_players: testProgramItem.maxAttendance,
  slug: testProgramItem.programItemId,
  three_word_description: testProgramItem.shortDescription,
  other_author: testProgramItem.otherAuthor,
  physical_play: KompassiPhysicalPlayHitpoint.SOME,
  is_english_ok: false,
  is_age_restricted: false,
  is_beginner_friendly: false,
  is_children_friendly: false,
  is_intended_for_experienced_participants: false,
  is_public: false,
  video_link: "",
};

export const mockKompassiProgramItemHitpoint2: KompassiProgramItemHitpoint = {
  title: testProgramItem2.title,
  description: testProgramItem2.description,
  category_title: KompassiProgramTypeHitpoint.TABLETOP_RPG,
  formatted_hosts: testProgramItem2.people,
  room_name: testProgramItem2.location,
  length: testProgramItem2.mins,
  start_time: testProgramItem2.startTime,
  rpg_system: testProgramItem2.gameSystem,
  min_players: testProgramItem2.minAttendance,
  max_players: testProgramItem2.maxAttendance,
  slug: testProgramItem2.programItemId,
  three_word_description: testProgramItem2.shortDescription,
  other_author: testProgramItem2.otherAuthor,
  physical_play: KompassiPhysicalPlayHitpoint.SOME,
  is_english_ok: false,
  is_age_restricted: false,
  is_beginner_friendly: false,
  is_children_friendly: false,
  is_intended_for_experienced_participants: false,
  is_public: false,
  video_link: "",
};
