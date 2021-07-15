import mongoose from 'mongoose';
import { Game } from 'shared/typings/models/game';

export interface GameDoc extends Game, mongoose.Document {}

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
  content_warnings: string;
  other_author: string;
  ropecon2018_characters: number;
  ropecon2021_accessibility_loud_sounds: boolean;
  ropecon2021_accessibility_flashing_lights: boolean;
  ropecon2021_accessibility_strong_smells: boolean;
  ropecon2021_accessibility_irritate_skin: boolean;
  ropecon2021_accessibility_physical_contact: boolean;
  ropecon2021_accessibility_low_lightning: boolean;
  ropecon2021_accessibility_moving_around: boolean;
  ropecon2021_accessibility_video: boolean;
  ropecon2021_accessibility_recording: boolean;
  ropecon2021_accessibility_text: boolean;
  ropecon2021_accessibility_colourblind: boolean;
}

export interface GameWithPlayerCount {
  game: Game;
  players: number;
}
