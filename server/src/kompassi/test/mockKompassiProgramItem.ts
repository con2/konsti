import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  KompassiProgramItem,
  KompassiGamestyle,
  KompassiLanguage,
  KompassiInclusivity,
  KompassiKonstiProgramType,
  KompassiGrouping,
  KompassiAgeGroup,
  KompassiRegistration,
  KompassiBoolean,
} from "server/kompassi/kompassiProgramItem";

export const mockKompassiProgramItem: KompassiProgramItem = {
  slug: testProgramItem.programItemId,
  title: testProgramItem.title,
  description: testProgramItem.description,
  cachedHosts: testProgramItem.people,
  isCancelled: false,
  cachedDimensions: {
    konsti: [KompassiKonstiProgramType.TABLETOP_RPG],
    grouping: [KompassiGrouping.BEGINNERS],
    language: [KompassiLanguage.FINNISH],
    ["age-group"]: [KompassiAgeGroup.ADULTS],
    ["game-style"]: [
      KompassiGamestyle.CHARACTER_DRIVEN,
      KompassiGamestyle.RULES_LIGHT,
    ],
    inclusivity: [
      KompassiInclusivity.FLASHING_LIGHTS,
      KompassiInclusivity.LOUD_SOUNDS,
    ],
    registration: [KompassiRegistration.KONSTI],
    revolvingdoor: [KompassiBoolean.FALSE],
  },
  scheduleItems: [
    {
      slug: testProgramItem.programItemId,
      title: testProgramItem.title,
      startTime: testProgramItem.startTime,
      endTime: testProgramItem.endTime,
      lengthMinutes: testProgramItem.mins,
      location: testProgramItem.location,
      isCancelled: false,
      cachedAnnotations: {
        "konsti:maxAttendance": testProgramItem.maxAttendance,
      },
    },
  ],
  cachedAnnotations: {
    "konsti:rpgSystem": testProgramItem.gameSystem,
    "ropecon:otherAuthor": testProgramItem.otherAuthor,
    "konsti:minAttendance": testProgramItem.minAttendance,
    "ropecon:numCharacters": testProgramItem.maxAttendance,
    "konsti:workshopFee": "",
    "konsti:entryConditionK16": false,
    "ropecon:contentWarnings": testProgramItem.contentWarnings,
    "ropecon:accessibilityOther": "Other accessibility information",
    "ropecon:gameSlogan": testProgramItem.shortDescription,
    "ropecon:isRevolvingDoor": false,
    "konsti:isPlaceholder": false,
  },
};

export const mockKompassiProgramItem2: KompassiProgramItem = {
  slug: testProgramItem2.programItemId,
  title: testProgramItem2.title,
  description: testProgramItem2.description,
  cachedHosts: testProgramItem2.people,
  isCancelled: false,
  cachedDimensions: {
    konsti: [KompassiKonstiProgramType.TABLETOP_RPG],
    grouping: [KompassiGrouping.BEGINNERS],
    language: [KompassiLanguage.FINNISH],
    ["age-group"]: [KompassiAgeGroup.ADULTS],
    ["game-style"]: [
      KompassiGamestyle.CHARACTER_DRIVEN,
      KompassiGamestyle.RULES_LIGHT,
    ],
    inclusivity: [
      KompassiInclusivity.FLASHING_LIGHTS,
      KompassiInclusivity.LOUD_SOUNDS,
    ],
    registration: [KompassiRegistration.KONSTI],
    revolvingdoor: [KompassiBoolean.FALSE],
  },
  scheduleItems: [
    {
      slug: testProgramItem2.programItemId,
      title: testProgramItem2.title,
      startTime: testProgramItem2.startTime,
      endTime: testProgramItem2.endTime,
      lengthMinutes: testProgramItem2.mins,
      location: testProgramItem2.location,
      isCancelled: false,
      cachedAnnotations: {
        "konsti:maxAttendance": testProgramItem2.maxAttendance,
      },
    },
  ],
  cachedAnnotations: {
    "konsti:rpgSystem": testProgramItem2.gameSystem,
    "ropecon:otherAuthor": testProgramItem2.otherAuthor,
    "konsti:minAttendance": testProgramItem2.minAttendance,
    "ropecon:numCharacters": testProgramItem2.maxAttendance,
    "konsti:workshopFee": "",
    "konsti:entryConditionK16": false,
    "ropecon:contentWarnings": testProgramItem2.contentWarnings,
    "ropecon:accessibilityOther": "Other accessibility information",
    "ropecon:gameSlogan": testProgramItem2.shortDescription,
    "ropecon:isRevolvingDoor": false,
    "konsti:isPlaceholder": false,
  },
};
