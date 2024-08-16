import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  KompassiProgramItemTracon,
  KompassiPlaystyleTracon,
  KompassiLanguageTracon,
  KompassiKonstiProgramTypeTracon,
  KompassiAudienceTracon,
  KompassiAccessibilityTracon,
  KompassiTopicTracon,
} from "server/kompassi/tracon/kompassiProgramItemTracon";

export const mockKompassiProgramItemTracon: KompassiProgramItemTracon = {
  slug: testProgramItem.programItemId,
  title: testProgramItem.title,
  description: testProgramItem.description,
  cachedHosts: testProgramItem.people,
  cachedDimensions: {
    date: [""],
    room: [testProgramItem.location],
    type: [""],
    topic: [KompassiTopicTracon.THEME],
    konsti: [KompassiKonstiProgramTypeTracon.TABLETOP_RPG],
    audience: [
      KompassiAudienceTracon.BEGINNERS,
      KompassiAudienceTracon.AIMED_UNDER_13,
    ],
    language: [KompassiLanguageTracon.FINNISH],
    accessibility: [
      KompassiAccessibilityTracon.LONG_TEXTS,
      KompassiAccessibilityTracon.MOVING_AROUND,
    ],
    playstyle: [
      KompassiPlaystyleTracon.CHARACTER_DRIVEN,
      KompassiPlaystyleTracon.RULES_LIGHT,
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

export const mockKompassiProgramItemTracon2: KompassiProgramItemTracon = {
  slug: testProgramItem2.programItemId,
  title: testProgramItem2.title,
  description: testProgramItem2.description,
  cachedHosts: testProgramItem2.people,
  cachedDimensions: {
    date: [""],
    room: [testProgramItem.location],
    type: [""],
    topic: [KompassiTopicTracon.THEME],
    konsti: [KompassiKonstiProgramTypeTracon.TABLETOP_RPG],
    audience: [
      KompassiAudienceTracon.BEGINNERS,
      KompassiAudienceTracon.AIMED_UNDER_13,
    ],
    language: [KompassiLanguageTracon.FINNISH],
    accessibility: [
      KompassiAccessibilityTracon.LONG_TEXTS,
      KompassiAccessibilityTracon.MOVING_AROUND,
    ],
    playstyle: [
      KompassiPlaystyleTracon.CHARACTER_DRIVEN,
      KompassiPlaystyleTracon.RULES_LIGHT,
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
