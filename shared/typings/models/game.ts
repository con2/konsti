import { Record, String, Number, Static, Boolean, Array } from 'runtypes';

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
