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
  KompassiProgramItemTracon,
  KompassiPlaystyleTracon,
  KompassiLanguageTracon,
  KompassiKonstiProgramTypeTracon,
  KompassiAudienceTracon,
  KompassiAccessibilityTracon,
  KompassiTopicTracon,
} from "server/kompassi/tracon/kompassiProgramItemTracon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";
import { getShortDescriptionFromDescription } from "server/utils/getShortDescriptionFromDescription";

export const kompassiProgramItemMapperTracon = (
  programItems: readonly KompassiProgramItemTracon[],
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
  kompassiProgramItem: KompassiProgramItemTracon,
): ProgramType => {
  const programType = kompassiProgramItem.cachedDimensions.konsti[0];

  switch (programType) {
    case KompassiKonstiProgramTypeTracon.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiKonstiProgramTypeTracon.LARP:
      return ProgramType.LARP;

    case KompassiKonstiProgramTypeTracon.TOURNAMENT:
      return ProgramType.TOURNAMENT;

    case KompassiKonstiProgramTypeTracon.WORKSHOP:
      return ProgramType.WORKSHOP;

    case KompassiKonstiProgramTypeTracon.EXPERIENCE_POINT:
      return ProgramType.EXPERIENCE_POINT;

    case KompassiKonstiProgramTypeTracon.OTHER:
      return ProgramType.OTHER;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiProgramItem: KompassiProgramItemTracon): Tag[] => {
  const audiences = kompassiProgramItem.cachedDimensions.audience;
  const tags: Tag[] = audiences.map((audience) => {
    switch (audience) {
      case KompassiAudienceTracon.K_18:
        return Tag.FOR_18_PLUS_ONLY;

      case KompassiAudienceTracon.BEGINNERS:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiAudienceTracon.AIMED_UNDER_13:
        return Tag.AIMED_UNDER_13;

      case KompassiAudienceTracon.AIMED_BETWEEN_13_17:
        return Tag.AIMED_BETWEEN_13_17;

      case KompassiAudienceTracon.AIMED_ADULTS:
        return Tag.AIMED_ADULTS;

      case KompassiAudienceTracon.ALL_AGES:
        return Tag.ALL_AGES;

      default:
        return exhaustiveSwitchGuard(audience);
    }
  });

  const topics = kompassiProgramItem.cachedDimensions.topic;
  if (topics.includes(KompassiTopicTracon.GOH)) {
    tags.push(Tag.GUEST_OF_HONOR);
  }
  if (topics.includes(KompassiTopicTracon.THEME)) {
    tags.push(Tag.THEME_MONSTERS);
  }

  return tags;
};

const mapPlaystyles = (playstyles: KompassiPlaystyleTracon[]): Playstyle[] => {
  return playstyles.map((playstyle) => {
    switch (playstyle) {
      case KompassiPlaystyleTracon.SERIOUS:
        return Playstyle.SERIOUS;

      case KompassiPlaystyleTracon.LIGHT:
        return Playstyle.LIGHT;

      case KompassiPlaystyleTracon.RULES_HEAVY:
        return Playstyle.RULES_HEAVY;

      case KompassiPlaystyleTracon.RULES_LIGHT:
        return Playstyle.RULES_LIGHT;

      case KompassiPlaystyleTracon.STORY_DRIVEN:
        return Playstyle.STORY_DRIVEN;

      case KompassiPlaystyleTracon.CHARACTER_DRIVEN:
        return Playstyle.CHARACTER_DRIVEN;

      case KompassiPlaystyleTracon.COMBAT_DRIVEN:
        return Playstyle.COMBAT_DRIVEN;

      default:
        return exhaustiveSwitchGuard(playstyle);
    }
  });
};

const mapLanguages = (
  kompassiLanguages: KompassiLanguageTracon[],
): Language[] => {
  const languages: Language[] = [];

  if (kompassiLanguages.includes(KompassiLanguageTracon.FINNISH)) {
    languages.push(Language.FINNISH);
  }
  if (kompassiLanguages.includes(KompassiLanguageTracon.ENGLISH)) {
    languages.push(Language.ENGLISH);
  }
  if (kompassiLanguages.includes(KompassiLanguageTracon.SWEDISH)) {
    languages.push(Language.SWEDISH);
  }
  if (kompassiLanguages.includes(KompassiLanguageTracon.LANGUAGE_FREE)) {
    languages.push(Language.LANGUAGE_FREE);
  }

  return languages;
};

const mapAccessibilityValues = (
  kompassiAccessibilityValues: KompassiAccessibilityTracon[],
): AccessibilityValue[] => {
  const accessibilityValues = kompassiAccessibilityValues.map(
    (kompassiAccessibilityValue) => {
      switch (kompassiAccessibilityValue) {
        case KompassiAccessibilityTracon.LOUD_SOUNDS:
          return AccessibilityValue.LOUD_SOUNDS;
        case KompassiAccessibilityTracon.PHYSICAL_CONTACT:
          return AccessibilityValue.PHYSICAL_CONTACT;
        case KompassiAccessibilityTracon.MOVING_AROUND:
          return AccessibilityValue.MOVING_AROUND;
        case KompassiAccessibilityTracon.DURATION_OVER_2H:
          return AccessibilityValue.DURATION_OVER_2H;
        case KompassiAccessibilityTracon.REQUIRES_DEXTERITY:
          return AccessibilityValue.REQUIRES_DEXTERITY;
        case KompassiAccessibilityTracon.RECORDING:
          return AccessibilityValue.RECORDING;
        case KompassiAccessibilityTracon.REQUIRES_QUICK_REACTIONS:
          return AccessibilityValue.REQUIRES_QUICK_REACTIONS;
        case KompassiAccessibilityTracon.COLORBLIND:
          return AccessibilityValue.COLORBLIND;
        case KompassiAccessibilityTracon.TEXTS_WITH_NO_RECORDINGS:
          return AccessibilityValue.TEXTS_WITH_NO_RECORDINGS;
        case KompassiAccessibilityTracon.LIMITED_MOVING_OPPORTUNITIES:
          return AccessibilityValue.LIMITED_MOVING_OPPORTUNITIES;
        case KompassiAccessibilityTracon.FLASHING_LIGHTS:
          return AccessibilityValue.FLASHING_LIGHTS;
        case KompassiAccessibilityTracon.LOW_LIGHTING:
          return AccessibilityValue.LOW_LIGHTING;
        case KompassiAccessibilityTracon.LONG_TEXTS:
          return AccessibilityValue.LONG_TEXTS;
        case KompassiAccessibilityTracon.IRRITATE_SKIN:
          return AccessibilityValue.IRRITATE_SKIN;
        case KompassiAccessibilityTracon.VIDEO:
          return AccessibilityValue.VIDEO;
        case KompassiAccessibilityTracon.STRONG_SMELLS:
          return AccessibilityValue.STRONG_SMELLS;
        default:
          return exhaustiveSwitchGuard(kompassiAccessibilityValue);
      }
    },
  );

  return accessibilityValues;
};

const mapRevolvingDoor = (
  kompassiProgramItem: KompassiProgramItemTracon,
): boolean => {
  if (kompassiProgramItem.cachedAnnotations["ropecon:isRevolvingDoor"]) {
    return true;
  }

  if (
    kompassiProgramItem.cachedDimensions.konsti[0] ===
      KompassiKonstiProgramTypeTracon.WORKSHOP &&
    kompassiProgramItem.cachedAnnotations["konsti:maxAttendance"] === 0
  ) {
    return true;
  }

  if (config.event().addRevolvingDoorIds.includes(kompassiProgramItem.slug)) {
    return true;
  }

  return false;
};

const mapMaxAttendance = (
  kompassiProgramItem: KompassiProgramItemTracon,
): number => {
  if (
    kompassiProgramItem.cachedDimensions.konsti[0] ===
    KompassiKonstiProgramTypeTracon.LARP
  ) {
    return kompassiProgramItem.cachedAnnotations["ropecon:numCharacters"];
  }

  return kompassiProgramItem.cachedAnnotations["konsti:maxAttendance"];
};

const mapShortDescription = (
  kompassiProgramItem: KompassiProgramItemTracon,
): string => {
  if (kompassiProgramItem.cachedAnnotations["ropecon:gameSlogan"]) {
    return kompassiProgramItem.cachedAnnotations["ropecon:gameSlogan"];
  }

  return getShortDescriptionFromDescription(kompassiProgramItem.description);
};
