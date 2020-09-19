import mongoose from 'mongoose';
import { Record, String, Number, Static, Boolean, Array } from 'runtypes';

export interface GameDoc extends Game, mongoose.Document {}

export const GameRuntype = Record({
  gameId: String,
  title: String,
  description: String,
  location: String,
  startTime: String,
  mins: Number,
  tags: Array(String).asReadonly(),
  genres: Array(String).asReadonly(),
  styles: Array(String).asReadonly(),
  language: String,
  endTime: String,
  people: String,
  minAttendance: Number,
  maxAttendance: Number,
  gameSystem: String,
  englishOk: Boolean,
  childrenFriendly: Boolean,
  ageRestricted: Boolean,
  beginnerFriendly: Boolean,
  intendedForExperiencedParticipants: Boolean,
  popularity: Number,
  shortDescription: String,
  revolvingDoor: Boolean,
  programType: String,
});

export type Game = Static<typeof GameRuntype>;

export interface KompassiGame {
  title: string;
  description: string;
  category_title: string;
  formatted_hosts: string;
  room_name: string;
  length: number;
  start_time: string;
  end_time: string;
  language: string;
  rpg_system: string;
  no_language: boolean;
  english_ok: boolean;
  children_friendly: boolean;
  age_restricted: boolean;
  beginner_friendly: boolean;
  intended_for_experienced_participants: boolean;
  min_players: number;
  max_players: number;
  identifier: string;
  tags: readonly string[];
  genres: readonly string[];
  styles: readonly string[];
  short_blurb: string;
  revolving_door: boolean;
  three_word_description: string;
  is_beginner_friendly: boolean;
}

export interface GameWithPlayerCount {
  game: Game;
  players: number;
}
