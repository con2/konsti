import {
  testProgramItem,
  testProgramItem2,
} from "shared/tests/testProgramItem";
import {
  KompassiProgramItemRopecon,
  KompassiPlaystyleRopecon,
  KompassiLanguageRopecon,
  KompassiKonstiProgramTypeRopecon,
  KompassiAudienceRopecon,
  KompassiAccessibilityRopecon,
  KompassiTopicRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";

export const mockKompassiProgramItemRopecon: KompassiProgramItemRopecon = {
  slug: testProgramItem.programItemId,
  title: testProgramItem.title,
  description: testProgramItem.description,
  cachedHosts: testProgramItem.people,
  cachedDimensions: {
    date: [""],
    room: [testProgramItem.location],
    type: [""],
    topic: [KompassiTopicRopecon.THEME],
    konsti: [KompassiKonstiProgramTypeRopecon.TABLETOP_RPG],
    audience: [
      KompassiAudienceRopecon.BEGINNERS,
      KompassiAudienceRopecon.AIMED_UNDER_13,
    ],
    language: [KompassiLanguageRopecon.FINNISH],
    accessibility: [
      KompassiAccessibilityRopecon.LONG_TEXTS,
      KompassiAccessibilityRopecon.MOVING_AROUND,
    ],
    playstyle: [
      KompassiPlaystyleRopecon.CHARACTER_DRIVEN,
      KompassiPlaystyleRopecon.RULES_LIGHT,
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
  },
  revolving_door: false,
};

export const mockKompassiProgramItemRopecon2: KompassiProgramItemRopecon = {
  slug: testProgramItem2.programItemId,
  title: testProgramItem2.title,
  description: testProgramItem2.description,
  cachedHosts: testProgramItem2.people,
  cachedDimensions: {
    date: [""],
    room: [testProgramItem.location],
    type: [""],
    topic: [KompassiTopicRopecon.THEME],
    konsti: [KompassiKonstiProgramTypeRopecon.TABLETOP_RPG],
    audience: [
      KompassiAudienceRopecon.BEGINNERS,
      KompassiAudienceRopecon.AIMED_UNDER_13,
    ],
    language: [KompassiLanguageRopecon.FINNISH],
    accessibility: [
      KompassiAccessibilityRopecon.LONG_TEXTS,
      KompassiAccessibilityRopecon.MOVING_AROUND,
    ],
    playstyle: [
      KompassiPlaystyleRopecon.CHARACTER_DRIVEN,
      KompassiPlaystyleRopecon.RULES_LIGHT,
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
  },
  revolving_door: false,
};
