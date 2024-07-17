import dayjs from "dayjs";
import {
  AccessibilityValue,
  ProgramItem,
  Playstyle,
  Language,
  ProgramType,
  Tag,
  SignupType,
} from "shared/types/models/programItem";
import {
  KompassiProgramItemRopecon,
  KompassiPlaystyleRopecon,
  KompassiLanguageRopecon,
  KompassiKonstiProgramTypeRopecon,
  KompassiAudienceRopecon,
  KompassiAccessibilityRopecon,
  KompassiTopicRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";
import { getShortDescriptionFromDescription } from "server/utils/getShortDescriptionFromDescription";

export const kompassiProgramItemMapperRopecon = (
  programItems: readonly KompassiProgramItemRopecon[],
): readonly ProgramItem[] => {
  return programItems.map((programItem) => {
    return {
      programItemId: programItem.slug,
      title: programItem.title,
      description: programItem.description,
      location: programItem.scheduleItems[0].location,
      startTime: dayjs(programItem.scheduleItems[0].startTime).toISOString(),
      mins:
        programItem.scheduleItems[0].lengthMinutes ||
        dayjs(programItem.scheduleItems[0].endTime).diff(
          dayjs(programItem.scheduleItems[0].startTime),
          "minute",
        ),
      tags: mapTags(programItem),
      genres: [],
      styles: mapPlaystyles(programItem.cachedDimensions.playstyle),
      languages: mapLanguages(programItem.cachedDimensions.language),
      endTime: dayjs(programItem.scheduleItems[0].endTime).toISOString(),
      people: programItem.cachedHosts,
      minAttendance: programItem.cachedAnnotations["konsti:minAttendance"],
      maxAttendance: mapMaxAttendance(programItem),
      gameSystem: programItem.cachedAnnotations["konsti:rpgSystem"],
      shortDescription: mapShortDescription(programItem),
      revolvingDoor: mapRevolvingDoor(programItem),
      programType: mapProgramType(programItem),
      contentWarnings: programItem.cachedAnnotations["ropecon:contentWarnings"],
      otherAuthor: programItem.cachedAnnotations["ropecon:otherAuthor"],
      accessibilityValues: mapAccessibilityValues(
        programItem.cachedDimensions.accessibility,
      ),
      popularity: 0,
      otherAccessibilityInformation:
        programItem.cachedAnnotations["ropecon:accessibilityOther"],
      entryFee: programItem.cachedAnnotations["konsti:workshopFee"],
      signupType: SignupType.KONSTI,
    };
  });
};

const mapProgramType = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): ProgramType => {
  const programType = kompassiProgramItem.cachedDimensions.konsti[0];

  switch (programType) {
    case KompassiKonstiProgramTypeRopecon.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiKonstiProgramTypeRopecon.LARP:
      return ProgramType.LARP;

    case KompassiKonstiProgramTypeRopecon.TOURNAMENT:
      return ProgramType.TOURNAMENT;

    case KompassiKonstiProgramTypeRopecon.WORKSHOP:
      return ProgramType.WORKSHOP;

    case KompassiKonstiProgramTypeRopecon.EXPERIENCE_POINT:
      return ProgramType.EXPERIENCE_POINT;

    case KompassiKonstiProgramTypeRopecon.OTHER:
      return ProgramType.OTHER;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiProgramItem: KompassiProgramItemRopecon): Tag[] => {
  const audiences = kompassiProgramItem.cachedDimensions.audience;
  const tags: Tag[] = audiences.map((audience) => {
    switch (audience) {
      case KompassiAudienceRopecon.K_18:
        return Tag.FOR_18_PLUS_ONLY;

      case KompassiAudienceRopecon.BEGINNERS:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiAudienceRopecon.AIMED_UNDER_13:
        return Tag.AIMED_UNDER_13;

      case KompassiAudienceRopecon.AIMED_BETWEEN_13_17:
        return Tag.AIMED_BETWEEN_13_17;

      case KompassiAudienceRopecon.AIMED_ADULTS:
        return Tag.AIMED_ADULTS;

      case KompassiAudienceRopecon.ALL_AGES:
        return Tag.ALL_AGES;

      default:
        return exhaustiveSwitchGuard(audience);
    }
  });

  const topics = kompassiProgramItem.cachedDimensions.topic;
  if (topics.includes(KompassiTopicRopecon.GOH)) {
    tags.push(Tag.GUEST_OF_HONOR);
  }
  if (topics.includes(KompassiTopicRopecon.THEME)) {
    tags.push(Tag.THEME_MONSTERS);
  }

  return tags;
};

const mapPlaystyles = (playstyles: KompassiPlaystyleRopecon[]): Playstyle[] => {
  return playstyles.map((playstyle) => {
    switch (playstyle) {
      case KompassiPlaystyleRopecon.SERIOUS:
        return Playstyle.SERIOUS;

      case KompassiPlaystyleRopecon.LIGHT:
        return Playstyle.LIGHT;

      case KompassiPlaystyleRopecon.RULES_HEAVY:
        return Playstyle.RULES_HEAVY;

      case KompassiPlaystyleRopecon.RULES_LIGHT:
        return Playstyle.RULES_LIGHT;

      case KompassiPlaystyleRopecon.STORY_DRIVEN:
        return Playstyle.STORY_DRIVEN;

      case KompassiPlaystyleRopecon.CHARACTER_DRIVEN:
        return Playstyle.CHARACTER_DRIVEN;

      case KompassiPlaystyleRopecon.COMBAT_DRIVEN:
        return Playstyle.COMBAT_DRIVEN;

      default:
        return exhaustiveSwitchGuard(playstyle);
    }
  });
};

const mapLanguages = (
  kompassiLanguages: KompassiLanguageRopecon[],
): Language[] => {
  const languages: Language[] = [];

  if (kompassiLanguages.includes(KompassiLanguageRopecon.FINNISH)) {
    languages.push(Language.FINNISH);
  }
  if (kompassiLanguages.includes(KompassiLanguageRopecon.ENGLISH)) {
    languages.push(Language.ENGLISH);
  }
  if (kompassiLanguages.includes(KompassiLanguageRopecon.SWEDISH)) {
    languages.push(Language.SWEDISH);
  }
  if (kompassiLanguages.includes(KompassiLanguageRopecon.LANGUAGE_FREE)) {
    languages.push(Language.LANGUAGE_FREE);
  }

  return languages;
};

const mapAccessibilityValues = (
  kompassiAccessibilityValues: KompassiAccessibilityRopecon[],
): AccessibilityValue[] => {
  const accessibilityValues = kompassiAccessibilityValues.map(
    (kompassiAccessibilityValue) => {
      switch (kompassiAccessibilityValue) {
        case KompassiAccessibilityRopecon.LOUD_SOUNDS:
          return AccessibilityValue.LOUD_SOUNDS;
        case KompassiAccessibilityRopecon.PHYSICAL_CONTACT:
          return AccessibilityValue.PHYSICAL_CONTACT;
        case KompassiAccessibilityRopecon.MOVING_AROUND:
          return AccessibilityValue.MOVING_AROUND;
        case KompassiAccessibilityRopecon.DURATION_OVER_2H:
          return AccessibilityValue.DURATION_OVER_2H;
        case KompassiAccessibilityRopecon.REQUIRES_DEXTERITY:
          return AccessibilityValue.REQUIRES_DEXTERITY;
        case KompassiAccessibilityRopecon.RECORDING:
          return AccessibilityValue.RECORDING;
        case KompassiAccessibilityRopecon.REQUIRES_QUICK_REACTIONS:
          return AccessibilityValue.REQUIRES_QUICK_REACTIONS;
        case KompassiAccessibilityRopecon.COLORBLIND:
          return AccessibilityValue.COLORBLIND;
        case KompassiAccessibilityRopecon.TEXTS_WITH_NO_RECORDINGS:
          return AccessibilityValue.TEXTS_WITH_NO_RECORDINGS;
        case KompassiAccessibilityRopecon.LIMITED_MOVING_OPPORTUNITIES:
          return AccessibilityValue.LIMITED_MOVING_OPPORTUNITIES;
        case KompassiAccessibilityRopecon.FLASHING_LIGHTS:
          return AccessibilityValue.FLASHING_LIGHTS;
        case KompassiAccessibilityRopecon.LOW_LIGHTING:
          return AccessibilityValue.LOW_LIGHTING;
        case KompassiAccessibilityRopecon.LONG_TEXTS:
          return AccessibilityValue.LONG_TEXTS;
        case KompassiAccessibilityRopecon.IRRITATE_SKIN:
          return AccessibilityValue.IRRITATE_SKIN;
        case KompassiAccessibilityRopecon.VIDEO:
          return AccessibilityValue.VIDEO;
        case KompassiAccessibilityRopecon.STRONG_SMELLS:
          return AccessibilityValue.STRONG_SMELLS;
        default:
          return exhaustiveSwitchGuard(kompassiAccessibilityValue);
      }
    },
  );

  return accessibilityValues;
};

const mapRevolvingDoor = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): boolean => {
  if (kompassiProgramItem.cachedAnnotations["ropecon:isRevolvingDoor"]) {
    return true;
  }

  if (
    kompassiProgramItem.cachedDimensions.konsti[0] ===
      KompassiKonstiProgramTypeRopecon.WORKSHOP &&
    kompassiProgramItem.cachedAnnotations["konsti:maxAttendance"] === 0
  ) {
    return true;
  }

  if (config.shared().addRevolvingDoorIds.includes(kompassiProgramItem.slug)) {
    return true;
  }

  return false;
};

const mapMaxAttendance = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): number => {
  if (
    kompassiProgramItem.cachedDimensions.konsti[0] ===
    KompassiKonstiProgramTypeRopecon.LARP
  ) {
    return kompassiProgramItem.cachedAnnotations["ropecon:numCharacters"];
  }

  return kompassiProgramItem.cachedAnnotations["konsti:maxAttendance"];
};

const mapShortDescription = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): string => {
  if (kompassiProgramItem.cachedAnnotations["ropecon:gameSlogan"]) {
    return kompassiProgramItem.cachedAnnotations["ropecon:gameSlogan"];
  }

  return getShortDescriptionFromDescription(kompassiProgramItem.description);
};
