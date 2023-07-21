import {
  AccessibilityValue,
  Game,
  GameStyle,
  Genre,
  Language,
  ProgramType,
  Tag,
} from "shared/typings/models/game";

export const testGame: Game = {
  gameId: "p2106",
  title: "Test game",
  description: "Test game description",
  location: "Test location",
  startTime: "2019-07-26T14:00:00.000Z",
  mins: 240,
  tags: [Tag.BEGINNER_FRIENDLY, Tag.IN_ENGLISH, Tag.CHILDREN_FRIENDLY],
  genres: [
    Genre.FANTASY,
    Genre.WAR,
    Genre.EXPLORATION,
    Genre.MYSTERY,
    Genre.DRAMA,
  ],
  styles: [
    GameStyle.SERIOUS,
    GameStyle.STORY_DRIVEN,
    GameStyle.CHARACTER_DRIVEN,
  ],
  language: Language.FINNISH,
  endTime: "2019-07-26T18:00:00.000Z",
  people: "Test GM",
  minAttendance: 2,
  maxAttendance: 4,
  gameSystem: "Test gamesystem",
  shortDescription: "Short description",
  revolvingDoor: true,
  popularity: 0,
  programType: ProgramType.TABLETOP_RPG,
  contentWarnings: "",
  otherAuthor: "",
  accessibilityValues: [
    AccessibilityValue.MOVING_AROUND,
    AccessibilityValue.FLASHING_LIGHTS,
  ],
  otherAccessibilityInformation: "",
  entryFee: "",
  signupType: "Konsti",
};

export const testGame2: Game = {
  gameId: "p3001",
  title: "Test game 2",
  description: "Test game description",
  location: "Test location",
  startTime: "2019-07-26T15:00:00.000Z",
  mins: 240,
  tags: [Tag.BEGINNER_FRIENDLY, Tag.IN_ENGLISH, Tag.CHILDREN_FRIENDLY],
  genres: [
    Genre.FANTASY,
    Genre.WAR,
    Genre.EXPLORATION,
    Genre.MYSTERY,
    Genre.DRAMA,
  ],
  styles: [
    GameStyle.SERIOUS,
    GameStyle.STORY_DRIVEN,
    GameStyle.CHARACTER_DRIVEN,
  ],
  language: Language.FINNISH,
  endTime: "2019-07-26T19:00:00.000Z",
  people: "Test GM",
  minAttendance: 2,
  maxAttendance: 4,
  gameSystem: "Test gamesystem",
  shortDescription: "Short description",
  revolvingDoor: true,
  popularity: 0,
  programType: ProgramType.TABLETOP_RPG,
  contentWarnings: "",
  otherAuthor: "",
  accessibilityValues: [
    AccessibilityValue.MOVING_AROUND,
    AccessibilityValue.FLASHING_LIGHTS,
  ],
  otherAccessibilityInformation: "",
  entryFee: "",
  signupType: "Konsti",
};
