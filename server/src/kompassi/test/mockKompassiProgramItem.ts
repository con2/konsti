import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  KompassiProgramItem,
  KompassiPlaystyle,
  KompassiLanguage,
  KompassiAudience,
  KompassiAccessibility,
  KompassiTopic,
} from "server/kompassi/kompassiProgramItem";
import { KompassiKonstiProgramType } from "server/kompassi/kompassiProgramItem";

export const mockKompassiProgramItem: KompassiProgramItem = {
  slug: testProgramItem.programItemId,
  title: testProgramItem.title,
  description: testProgramItem.description,
  cachedHosts: testProgramItem.people,
  cachedDimensions: {
    date: [""],
    room: [testProgramItem.location],
    type: [""],
    topic: [KompassiTopic.THEME],
    konsti: [KompassiKonstiProgramType.TABLETOP_RPG],
    audience: [KompassiAudience.BEGINNERS, KompassiAudience.AIMED_UNDER_13],
    language: [KompassiLanguage.FINNISH],
    accessibility: [
      KompassiAccessibility.LONG_TEXTS,
      KompassiAccessibility.MOVING_AROUND,
    ],
    playstyle: [
      KompassiPlaystyle.CHARACTER_DRIVEN,
      KompassiPlaystyle.RULES_LIGHT,
    ],
  },
  scheduleItems: [
    {
      startTime: testProgramItem.startTime,
      endTime: testProgramItem.endTime,
      lengthMinutes: testProgramItem.mins,
      location: testProgramItem.location,
    },
  ],
  cachedAnnotations: {
    "konsti:rpgSystem": testProgramItem.gameSystem,
    "ropecon:otherAuthor": testProgramItem.otherAuthor,
    "konsti:minAttendance": testProgramItem.minAttendance,
    "konsti:maxAttendance": testProgramItem.maxAttendance,
    "ropecon:numCharacters": testProgramItem.maxAttendance,
    "konsti:workshopFee": "",
    "ropecon:contentWarnings": testProgramItem.contentWarnings,
    "ropecon:accessibilityOther": "Other accessibility information",
    "ropecon:gameSlogan": testProgramItem.shortDescription,
    "ropecon:isRevolvingDoor": false,
  },
};

export const mockKompassiProgramItem2: KompassiProgramItem = {
  slug: testProgramItem2.programItemId,
  title: testProgramItem2.title,
  description: testProgramItem2.description,
  cachedHosts: testProgramItem2.people,
  cachedDimensions: {
    date: [""],
    room: [testProgramItem.location],
    type: [""],
    topic: [KompassiTopic.THEME],
    konsti: [KompassiKonstiProgramType.TABLETOP_RPG],
    audience: [KompassiAudience.BEGINNERS, KompassiAudience.AIMED_UNDER_13],
    language: [KompassiLanguage.FINNISH],
    accessibility: [
      KompassiAccessibility.LONG_TEXTS,
      KompassiAccessibility.MOVING_AROUND,
    ],
    playstyle: [
      KompassiPlaystyle.CHARACTER_DRIVEN,
      KompassiPlaystyle.RULES_LIGHT,
    ],
  },
  scheduleItems: [
    {
      startTime: testProgramItem2.startTime,
      endTime: testProgramItem2.endTime,
      lengthMinutes: testProgramItem2.mins,
      location: testProgramItem2.location,
    },
  ],
  cachedAnnotations: {
    "konsti:rpgSystem": testProgramItem2.gameSystem,
    "ropecon:otherAuthor": testProgramItem2.otherAuthor,
    "konsti:minAttendance": testProgramItem2.minAttendance,
    "konsti:maxAttendance": testProgramItem2.maxAttendance,
    "ropecon:numCharacters": testProgramItem2.maxAttendance,
    "konsti:workshopFee": "",
    "ropecon:contentWarnings": testProgramItem2.contentWarnings,
    "ropecon:accessibilityOther": "Other accessibility information",
    "ropecon:gameSlogan": testProgramItem2.shortDescription,
    "ropecon:isRevolvingDoor": false,
  },
};
