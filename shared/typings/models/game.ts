import { Record, String, Number, Static, Boolean, Array } from 'runtypes';

const AccessibilityRuntype = Record({
  loudSounds: Boolean,
  flashingLights: Boolean,
  strongSmells: Boolean,
  irritateSkin: Boolean,
  physicalContact: Boolean,
  lowLighting: Boolean,
  movingAround: Boolean,
  video: Boolean,
  recording: Boolean,
  text: Boolean,
  colourblind: Boolean,
});

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
  contentWarnings: String,
  otherAuthor: String,
  accessibility: AccessibilityRuntype,
});

export type Game = Static<typeof GameRuntype>;
