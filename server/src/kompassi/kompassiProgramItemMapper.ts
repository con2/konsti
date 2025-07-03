import dayjs from "dayjs";
import { first } from "remeda";
import {
  InclusivityValue,
  ProgramItem,
  Gamestyle,
  Language,
  ProgramType,
  Tag,
  SignupType,
  Popularity,
} from "shared/types/models/programItem";
import {
  KompassiProgramItem,
  KompassiGamestyle,
  KompassiLanguage,
  KompassiInclusivity,
  KompassiKonstiProgramType,
  KompassiGrouping,
  KompassiAgeGroup,
  KompassiBoolean,
  KompassiRegistration,
  KompassiScheduleItem,
} from "server/kompassi/kompassiProgramItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";
import { getShortDescriptionFromDescription } from "server/utils/getShortDescriptionFromDescription";
import { mapKonstiProgramTypesToKompassiProgramTypes } from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";

const { customDetailsProgramItems } = config.event();

export const kompassiProgramItemMapper = (
  programItems: readonly KompassiProgramItem[],
): readonly ProgramItem[] => {
  return programItems.flatMap((programItem) => {
    return programItem.scheduleItems.map((scheduleItem) => {
      return {
        programItemId: scheduleItem.slug,
        title: scheduleItem.title,
        description: programItem.description,
        location: scheduleItem.location,
        startTime: dayjs(scheduleItem.startTime).toISOString(),
        mins:
          scheduleItem.lengthMinutes ||
          dayjs(scheduleItem.endTime).diff(
            dayjs(scheduleItem.startTime),
            "minute",
          ),
        tags: mapTags(programItem),
        genres: [],
        styles: mapGamestyles(programItem.cachedDimensions["game-style"]),
        languages: mapLanguages(programItem),
        endTime: dayjs(scheduleItem.endTime).toISOString(),
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
        accessibilityValues: mapInclusivityValues(
          programItem.cachedDimensions.inclusivity,
        ),
        popularity: Popularity.NULL,
        otherAccessibilityInformation:
          programItem.cachedAnnotations["ropecon:accessibilityOther"],
        entryFee: programItem.cachedAnnotations["konsti:workshopFee"],
        signupType: mapSignupType(programItem, scheduleItem),
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

  const groupings = kompassiProgramItem.cachedDimensions.grouping;

  const groupingTags: Tag[] = groupings.flatMap((grouping) => {
    switch (grouping) {
      case KompassiGrouping.BEGINNERS:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiGrouping.NEW_WORLDS:
        return Tag.THEME;

      case KompassiGrouping.LGBT:
        return Tag.LGBT;

      case KompassiGrouping.GOH:
        return Tag.GUEST_OF_HONOR;

      default:
        return exhaustiveSwitchGuard(grouping);
    }
  });

  const ageGroups = kompassiProgramItem.cachedDimensions["age-group"];

  const ageGroupTags: Tag[] = ageGroups.flatMap((ageGroup) => {
    switch (ageGroup) {
      case KompassiAgeGroup.EVERYONE:
        return Tag.EVERYONE;

      case KompassiAgeGroup.ADULTS:
        return Tag.ADULTS;

      case KompassiAgeGroup.TEENS:
        return Tag.TEENS;

      case KompassiAgeGroup.ONLY_ADULTS:
        return Tag.ONLY_ADULTS;

      case KompassiAgeGroup.KIDS:
        return Tag.KIDS;

      case KompassiAgeGroup.SMALL_KIDS:
        return Tag.SMALL_KIDS;
      default:
        return exhaustiveSwitchGuard(ageGroup);
    }
  });

  return [...groupingTags, ...ageGroupTags];
};

const mapGamestyles = (gamestyles: KompassiGamestyle[]): Gamestyle[] => {
  return gamestyles.map((gamestyle) => {
    switch (gamestyle) {
      case KompassiGamestyle.SERIOUS:
        return Gamestyle.SERIOUS;

      case KompassiGamestyle.LIGHT:
        return Gamestyle.LIGHT;

      case KompassiGamestyle.RULES_HEAVY:
        return Gamestyle.RULES_HEAVY;

      case KompassiGamestyle.RULES_LIGHT:
        return Gamestyle.RULES_LIGHT;

      case KompassiGamestyle.STORY_DRIVEN:
        return Gamestyle.STORY_DRIVEN;

      case KompassiGamestyle.CHARACTER_DRIVEN:
        return Gamestyle.CHARACTER_DRIVEN;

      case KompassiGamestyle.COMBAT_HEAVY:
        return Gamestyle.COMBAT_HEAVY;

      default:
        return exhaustiveSwitchGuard(gamestyle);
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

const mapInclusivityValues = (
  kompassiInclusivityValues: KompassiInclusivity[],
): InclusivityValue[] => {
  const accessibilityValues = kompassiInclusivityValues.map(
    (kompassiInclusivityValue) => {
      switch (kompassiInclusivityValue) {
        case KompassiInclusivity.COLOR_BLINDNESS:
          return InclusivityValue.COLOR_BLINDNESS;
        case KompassiInclusivity.FINGERS:
          return InclusivityValue.FINGERS;
        case KompassiInclusivity.LOUD_SOUNDS:
          return InclusivityValue.LOUD_SOUNDS;
        case KompassiInclusivity.PHYSICAL_CONTACT:
          return InclusivityValue.PHYSICAL_CONTACT;
        case KompassiInclusivity.LONG_PROGRAM:
          return InclusivityValue.LONG_PROGRAM;
        case KompassiInclusivity.NOT_AMPLIFIED:
          return InclusivityValue.NOT_AMPLIFIED;
        case KompassiInclusivity.NO_RECORDING_OR_SPOKEN_TEXT:
          return InclusivityValue.NO_RECORDING_OR_SPOKEN_TEXT;
        case KompassiInclusivity.DARK_LIGHTING:
          return InclusivityValue.DARK_LIGHTING;
        case KompassiInclusivity.NO_MOVEMENT:
          return InclusivityValue.NO_MOVEMENT;
        case KompassiInclusivity.NO_TEXT_OF_RECORDING:
          return InclusivityValue.NO_TEXT_OF_RECORDING;
        case KompassiInclusivity.LONG_TEXTS:
          return InclusivityValue.LONG_TEXTS;
        case KompassiInclusivity.LOTS_OF_MOVEMENT:
          return InclusivityValue.LOTS_OF_MOVEMENT;
        case KompassiInclusivity.FLASHING_LIGHTS:
          return InclusivityValue.FLASHING_LIGHTS;
        case KompassiInclusivity.QUICK_REACTIONS:
          return InclusivityValue.QUICK_REACTIONS;
        case KompassiInclusivity.NO_SUBTITLES:
          return InclusivityValue.NO_SUBTITLES;
        case KompassiInclusivity.STRONG_ODOURS:
          return InclusivityValue.STRONG_ODOURS;
        case KompassiInclusivity.IRRITATING_CHEMICALS:
          return InclusivityValue.IRRITATING_CHEMICALS;

        default:
          return exhaustiveSwitchGuard(kompassiInclusivityValue);
      }
    },
  );

  return accessibilityValues;
};

const mapRevolvingDoor = (
  kompassiProgramItem: KompassiProgramItem,
): boolean => {
  if (
    kompassiProgramItem.cachedDimensions.revolvingdoor[0] ===
    KompassiBoolean.TRUE
  ) {
    return true;
  }

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

const mapSignupType = (
  kompassiProgramItem: KompassiProgramItem,
  scheduleItem: KompassiScheduleItem,
): SignupType => {
  const usesKonstiRegisration =
    first(kompassiProgramItem.cachedDimensions.registration) ===
    KompassiRegistration.KONSTI;

  const programType = kompassiProgramItem.cachedDimensions.konsti[0];

  const evenHourProgramTypes = mapKonstiProgramTypesToKompassiProgramTypes(
    config.event().twoPhaseSignupProgramTypes,
  );

  // If program item using lottery doesn't start at event hour, disable Konsti signup
  if (usesKonstiRegisration && evenHourProgramTypes.includes(programType)) {
    const startsAtEvenHour = getStartsAtEvenHour(scheduleItem);
    if (!startsAtEvenHour) {
      return SignupType.NONE;
    }
  }

  if (kompassiProgramItem.cachedAnnotations["konsti:isPlaceholder"]) {
    return SignupType.NONE;
  }

  if (usesKonstiRegisration) {
    return SignupType.KONSTI;
  }

  return SignupType.NONE;
};

const getStartsAtEvenHour = (scheduleItem: KompassiScheduleItem): boolean => {
  const startMinute = dayjs(scheduleItem.startTime).minute();
  if (startMinute !== 0) {
    logger.info(
      `Lottery program item "${scheduleItem.slug}" doesn't start at even hour, disable Konsti signup`,
    );
    return false;
  }

  return true;
};
