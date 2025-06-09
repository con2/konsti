import dayjs from "dayjs";
import {
  AccessibilityValue,
  ProgramItem,
  Playstyle,
  Language,
  ProgramType,
  Tag,
  SignupType,
  Popularity,
} from "shared/types/models/programItem";
import {
  KompassiProgramItem,
  KompassiPlaystyle,
  KompassiLanguage,
  KompassiAudience,
  KompassiAccessibility,
  KompassiTopic,
  KompassiKonstiProgramType,
} from "server/kompassi/kompassiProgramItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";
import { getShortDescriptionFromDescription } from "server/utils/getShortDescriptionFromDescription";

const { customDetailsProgramItems } = config.event();

export const kompassiProgramItemMapper = (
  programItems: readonly KompassiProgramItem[],
): readonly ProgramItem[] => {
  return programItems.flatMap((programItem) => {
    return programItem.scheduleItems.map((scheduleItems) => {
      return {
        programItemId: scheduleItems.slug,
        title: scheduleItems.title,
        description: programItem.description,
        location: scheduleItems.location,
        startTime: dayjs(scheduleItems.startTime).toISOString(),
        mins:
          scheduleItems.lengthMinutes ||
          dayjs(scheduleItems.endTime).diff(
            dayjs(scheduleItems.startTime),
            "minute",
          ),
        tags: mapTags(programItem),
        genres: [],
        styles: mapPlaystyles(programItem.cachedDimensions.playstyle),
        languages: mapLanguages(programItem),
        endTime: dayjs(scheduleItems.endTime).toISOString(),
        people: programItem.cachedHosts,
        minAttendance: programItem.cachedAnnotations["konsti:minAttendance"],
        maxAttendance: mapMaxAttendance(programItem),
        gameSystem: programItem.cachedAnnotations["konsti:rpgSystem"],
        shortDescription: mapShortDescription(programItem),
        revolvingDoor: mapRevolvingDoor(programItem),
        programType: mapProgramType(programItem),
        contentWarnings:
          programItem.cachedAnnotations["ropecon:contentWarnings"],
        otherAuthor: programItem.cachedAnnotations["ropecon:otherAuthor"],
        accessibilityValues: mapAccessibilityValues(
          programItem.cachedDimensions.accessibility,
        ),
        popularity: Popularity.NULL,
        otherAccessibilityInformation:
          programItem.cachedAnnotations["ropecon:accessibilityOther"],
        entryFee: programItem.cachedAnnotations["konsti:workshopFee"],
        signupType: programItem.cachedAnnotations["konsti:isPlaceholder"]
          ? SignupType.NONE
          : SignupType.KONSTI,
      };
    });
  });
};

const mapProgramType = (
  kompassiProgramItem: KompassiProgramItem,
): ProgramType => {
  const programType = kompassiProgramItem.cachedDimensions.konsti[0];

  switch (programType) {
    case KompassiKonstiProgramType.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiKonstiProgramType.LARP:
      return ProgramType.LARP;

    case KompassiKonstiProgramType.TOURNAMENT:
      return ProgramType.TOURNAMENT;

    case KompassiKonstiProgramType.WORKSHOP:
      return ProgramType.WORKSHOP;

    case KompassiKonstiProgramType.EXPERIENCE_POINT:
      return ProgramType.EXPERIENCE_POINT;

    case KompassiKonstiProgramType.OTHER:
      return ProgramType.OTHER;

    case KompassiKonstiProgramType.FLEAMARKET:
      return ProgramType.FLEAMARKET;

    case KompassiKonstiProgramType.ROUNDTABLE_DISCUSSION:
      return ProgramType.ROUNDTABLE_DISCUSSION;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiProgramItem: KompassiProgramItem): Tag[] => {
  const customDetails = customDetailsProgramItems[kompassiProgramItem.slug];
  if (customDetails?.tags) {
    return customDetails.tags;
  }

  const audiences = kompassiProgramItem.cachedDimensions.audience;
  const tags: Tag[] = audiences.flatMap((audience) => {
    switch (audience) {
      case KompassiAudience.K_18:
      case KompassiAudience.R18:
        return Tag.FOR_18_PLUS_ONLY;

      case KompassiAudience.BEGINNERS:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiAudience.AIMED_UNDER_13:
        return Tag.AIMED_UNDER_13;

      case KompassiAudience.AIMED_BETWEEN_13_17:
        return Tag.AIMED_BETWEEN_13_17;

      case KompassiAudience.AIMED_ADULTS:
        return Tag.AIMED_ADULTS;

      case KompassiAudience.ALL_AGES:
        return Tag.ALL_AGES;

      case KompassiAudience.BEGINNER_FRIENDLY:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiAudience.EXPERIENCED:
        return Tag.INTENDED_FOR_EXPERIENCED_PARTICIPANTS;

      case KompassiAudience.CHILD_FRIENDLY:
        return Tag.CHILDREN_FRIENDLY;

      case KompassiAudience.UNRESTRICTED:
        return [];

      default:
        return exhaustiveSwitchGuard(audience);
    }
  });

  const topics = kompassiProgramItem.cachedDimensions.topic;
  if (topics.includes(KompassiTopic.GOH)) {
    tags.push(Tag.GUEST_OF_HONOR);
  }
  if (topics.includes(KompassiTopic.THEME)) {
    tags.push(Tag.THEME_MONSTERS);
  }

  return tags;
};

const mapPlaystyles = (playstyles: KompassiPlaystyle[]): Playstyle[] => {
  return playstyles.map((playstyle) => {
    switch (playstyle) {
      case KompassiPlaystyle.SERIOUS:
        return Playstyle.SERIOUS;

      case KompassiPlaystyle.LIGHT:
        return Playstyle.LIGHT;

      case KompassiPlaystyle.RULES_HEAVY:
        return Playstyle.RULES_HEAVY;

      case KompassiPlaystyle.RULES_LIGHT:
        return Playstyle.RULES_LIGHT;

      case KompassiPlaystyle.STORY_DRIVEN:
        return Playstyle.STORY_DRIVEN;

      case KompassiPlaystyle.CHARACTER_DRIVEN:
        return Playstyle.CHARACTER_DRIVEN;

      case KompassiPlaystyle.COMBAT_DRIVEN:
        return Playstyle.COMBAT_DRIVEN;

      default:
        return exhaustiveSwitchGuard(playstyle);
    }
  });
};

const mapLanguages = (kompassiProgramItem: KompassiProgramItem): Language[] => {
  const customDetails = customDetailsProgramItems[kompassiProgramItem.slug];
  if (customDetails?.languages) {
    return customDetails.languages;
  }

  const kompassiLanguages = kompassiProgramItem.cachedDimensions.language;
  const languages: Language[] = [];

  if (kompassiLanguages.includes(KompassiLanguage.FINNISH)) {
    languages.push(Language.FINNISH);
  }
  if (kompassiLanguages.includes(KompassiLanguage.ENGLISH)) {
    languages.push(Language.ENGLISH);
  }
  if (kompassiLanguages.includes(KompassiLanguage.SWEDISH)) {
    languages.push(Language.SWEDISH);
  }
  if (kompassiLanguages.includes(KompassiLanguage.LANGUAGE_FREE)) {
    languages.push(Language.LANGUAGE_FREE);
  }

  return languages;
};

const mapAccessibilityValues = (
  kompassiAccessibilityValues: KompassiAccessibility[],
): AccessibilityValue[] => {
  const accessibilityValues = kompassiAccessibilityValues.map(
    (kompassiAccessibilityValue) => {
      switch (kompassiAccessibilityValue) {
        case KompassiAccessibility.LOUD_SOUNDS:
          return AccessibilityValue.LOUD_SOUNDS;
        case KompassiAccessibility.PHYSICAL_CONTACT:
          return AccessibilityValue.PHYSICAL_CONTACT;
        case KompassiAccessibility.MOVING_AROUND:
          return AccessibilityValue.MOVING_AROUND;
        case KompassiAccessibility.DURATION_OVER_2H:
          return AccessibilityValue.DURATION_OVER_2H;
        case KompassiAccessibility.REQUIRES_DEXTERITY:
          return AccessibilityValue.REQUIRES_DEXTERITY;
        case KompassiAccessibility.RECORDING:
          return AccessibilityValue.RECORDING;
        case KompassiAccessibility.REQUIRES_QUICK_REACTIONS:
          return AccessibilityValue.REQUIRES_QUICK_REACTIONS;
        case KompassiAccessibility.COLORBLIND:
          return AccessibilityValue.COLORBLIND;
        case KompassiAccessibility.TEXTS_WITH_NO_RECORDINGS:
          return AccessibilityValue.TEXTS_WITH_NO_RECORDINGS;
        case KompassiAccessibility.LIMITED_MOVING_OPPORTUNITIES:
          return AccessibilityValue.LIMITED_MOVING_OPPORTUNITIES;
        case KompassiAccessibility.FLASHING_LIGHTS:
          return AccessibilityValue.FLASHING_LIGHTS;
        case KompassiAccessibility.LOW_LIGHTING:
          return AccessibilityValue.LOW_LIGHTING;
        case KompassiAccessibility.LONG_TEXTS:
          return AccessibilityValue.LONG_TEXTS;
        case KompassiAccessibility.IRRITATE_SKIN:
          return AccessibilityValue.IRRITATE_SKIN;
        case KompassiAccessibility.VIDEO:
          return AccessibilityValue.VIDEO;
        case KompassiAccessibility.STRONG_SMELLS:
          return AccessibilityValue.STRONG_SMELLS;
        default:
          return exhaustiveSwitchGuard(kompassiAccessibilityValue);
      }
    },
  );

  return accessibilityValues;
};

const mapRevolvingDoor = (
  kompassiProgramItem: KompassiProgramItem,
): boolean => {
  if (kompassiProgramItem.cachedAnnotations["ropecon:isRevolvingDoor"]) {
    return true;
  }

  if (config.event().enableRevolvingDoorWorkshopsIfNoMax) {
    if (
      kompassiProgramItem.cachedDimensions.konsti[0] ===
        KompassiKonstiProgramType.WORKSHOP &&
      kompassiProgramItem.cachedAnnotations["konsti:maxAttendance"] === 0
    ) {
      return true;
    }
  }

  if (config.event().addRevolvingDoorIds.includes(kompassiProgramItem.slug)) {
    return true;
  }

  return false;
};

const mapMaxAttendance = (kompassiProgramItem: KompassiProgramItem): number => {
  /*
  if (
    kompassiProgramItem.cachedDimensions.konsti[0] ===
    KompassiKonstiProgramType.LARP
  ) {
    return kompassiProgramItem.cachedAnnotations["ropecon:numCharacters"];
  }
  */

  return kompassiProgramItem.cachedAnnotations["konsti:maxAttendance"];
};

const mapShortDescription = (
  kompassiProgramItem: KompassiProgramItem,
): string => {
  if (kompassiProgramItem.cachedAnnotations["ropecon:gameSlogan"]) {
    return kompassiProgramItem.cachedAnnotations["ropecon:gameSlogan"];
  }

  return getShortDescriptionFromDescription(kompassiProgramItem.description);
};
