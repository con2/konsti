import { Record, String, Number, Static, Boolean, Array } from 'runtypes';

/*
export interface Game {
  gameId: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  mins: number;
  tags: readonly string[];
  genres: readonly string[];
  styles: readonly string[];
  language: string;
  endTime: string;
  people: string;
  minAttendance: number;
  maxAttendance: number;
  gameSystem: string;
  englishOk: boolean;
  childrenFriendly: boolean;
  ageRestricted: boolean;
  beginnerFriendly: boolean;
  intendedForExperiencedParticipants: boolean;
  shortDescription: string;
  revolvingDoor: boolean;
  popularity: number;
  programType: string;
}
*/

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
