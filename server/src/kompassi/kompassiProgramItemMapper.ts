import dayjs from "dayjs";
import { capitalize, first } from "remeda";
import {
  InclusivityValue,
  ProgramItem,
  Gamestyle,
  Language,
  ProgramType,
  Tag,
  AgeGroup,
  SignupType,
  Popularity,
  State,
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
  KompassiYesNo,
} from "server/kompassi/kompassiProgramItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";
import { getShortDescriptionFromDescription } from "server/utils/getShortDescriptionFromDescription";

const { customDetailsProgramItems } = config.event();

export const kompassiProgramItemMapper = (
  programItems: readonly KompassiProgramItem[],
): readonly ProgramItem[] => {
  return programItems.flatMap((programItem) => {
    return programItem.scheduleItems.map((scheduleItem) => {
      return {
        programItemId: scheduleItem.slug,
        parentId: programItem.slug,
        title: scheduleItem.title,
        description: programItem.description,
        location:
          scheduleItem.location ||
          capitalize(programItem.cachedDimensions.room[0]) ||
          "",
        startTime: dayjs(scheduleItem.startTime).toISOString(),
        mins:
          scheduleItem.lengthMinutes ||
          dayjs(scheduleItem.endTime).diff(
            dayjs(scheduleItem.startTime),
            "minute",
          ),
        tags: mapTags(programItem),
        ageGroups: mapAgeGroups(programItem),
        genres: [],
        styles: mapGamestyles(programItem.cachedDimensions["game-style"]),
        languages: mapLanguages(programItem),
        endTime: dayjs(scheduleItem.endTime).toISOString(),
        people: programItem.cachedHosts,
        minAttendance:
          programItem.cachedAnnotations["konsti:minAttendance"] || 1,
        maxAttendance: scheduleItem.cachedAnnotations["konsti:maxAttendance"],
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
        signupType: mapSignupType(programItem),
        state: mapState(programItem, scheduleItem),
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

    case KompassiKonstiProgramType.OTHER_GAMING:
      return ProgramType.OTHER_GAMING;

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

      case KompassiGrouping.THEME:
        return Tag.THEME;

      case KompassiGrouping.LGBT:
        return Tag.LGBT;

      case KompassiGrouping.GOH:
        return Tag.GUEST_OF_HONOR;

      default:
        return exhaustiveSwitchGuard(grouping);
    }
  });

  const otherTags: Tag[] = [];

  if (kompassiProgramItem.cachedAnnotations["konsti:entryConditionK16"]) {
    otherTags.push(Tag.K16);
  }

  if (isPreConventionWeek(kompassiProgramItem)) {
    otherTags.push(Tag.PRE_CONVENTION_WEEK);
  }

  if (usesGenAi(kompassiProgramItem)) {
    otherTags.push(Tag.USES_GEN_AI);
  }

  return [...groupingTags, ...otherTags];
};

const mapAgeGroups = (kompassiProgramItem: KompassiProgramItem): AgeGroup[] => {
  const customDetails = customDetailsProgramItems[kompassiProgramItem.slug];
  if (customDetails?.ageGroups) {
    return customDetails.ageGroups;
  }

  const ageGroups = kompassiProgramItem.cachedDimensions["age-group"];

  return ageGroups.map((ageGroup) => {
    switch (ageGroup) {
      case KompassiAgeGroup.EVERYONE:
        return AgeGroup.EVERYONE;

      case KompassiAgeGroup.ADULTS:
        return AgeGroup.ADULTS;

      case KompassiAgeGroup.TEENS:
        return AgeGroup.TEENS;

      case KompassiAgeGroup.ONLY_ADULTS:
        return AgeGroup.ONLY_ADULTS;

      case KompassiAgeGroup.KIDS:
        return AgeGroup.KIDS;

      case KompassiAgeGroup.SMALL_KIDS:
        return AgeGroup.SMALL_KIDS;

      case KompassiAgeGroup.ADULTS_AND_YOUTH:
        return AgeGroup.ADULTS_AND_YOUTH;

      case KompassiAgeGroup.YOUNG_ADULTS:
        return AgeGroup.YOUNG_ADULTS;

      case KompassiAgeGroup.FAMILIES:
        return AgeGroup.FAMILIES;

      default:
        return exhaustiveSwitchGuard(ageGroup);
    }
  });
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

  const languages = kompassiLanguages.map((kompassiLanguage) => {
    switch (kompassiLanguage) {
      case KompassiLanguage.FINNISH:
        return Language.FINNISH;

      case KompassiLanguage.ENGLISH:
        return Language.ENGLISH;

      case KompassiLanguage.SWEDISH:
        return Language.SWEDISH;

      case KompassiLanguage.LANGUAGE_FREE:
      case KompassiLanguage.LANG_FREE:
        return Language.LANGUAGE_FREE;

      default:
        return exhaustiveSwitchGuard(kompassiLanguage);
    }
  });

  return [...new Set(languages)];
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
    first(kompassiProgramItem.cachedDimensions.revolvingdoor) ===
    KompassiBoolean.TRUE
  ) {
    return true;
  }

  if (kompassiProgramItem.cachedAnnotations["ropecon:isRevolvingDoor"]) {
    return true;
  }

  if (config.event().addRevolvingDoorIds.includes(kompassiProgramItem.slug)) {
    return true;
  }

  return false;
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
): SignupType => {
  const registration = first(kompassiProgramItem.cachedDimensions.registration);

  if (kompassiProgramItem.cachedAnnotations["konsti:isPlaceholder"]) {
    return SignupType.OTHER;
  }

  if (!registration) {
    return config.event().defaultSignupType;
  }

  switch (registration) {
    case KompassiRegistration.EXPERIENCE_POINT:
      return SignupType.EXPERIENCE_POINT;
    case KompassiRegistration.GAMEPOINT:
      return SignupType.GAMEPOINT;
    case KompassiRegistration.KONSTI:
      return SignupType.KONSTI;
    case KompassiRegistration.NOT_REQUIRED:
      return SignupType.NOT_REQUIRED;
    case KompassiRegistration.OTHER:
      return SignupType.OTHER;
    case KompassiRegistration.ROPE_LARP_DESK:
      return SignupType.ROPE_LARP_DESK;
    default:
      return exhaustiveSwitchGuard(registration);
  }
};

const mapState = (
  kompassiProgramItem: KompassiProgramItem,
  scheduleItem: KompassiScheduleItem,
): State => {
  const isCancelled =
    scheduleItem.isCancelled || kompassiProgramItem.isCancelled;

  if (isCancelled) {
    return State.CANCELLED;
  }

  return State.ACCEPTED;
};

const isPreConventionWeek = (
  kompassiProgramItem: KompassiProgramItem,
): boolean =>
  kompassiProgramItem.cachedDimensions["is-pre-convention-week"][0] ===
  KompassiYesNo.YES;

const usesGenAi = (kompassiProgramItem: KompassiProgramItem): boolean =>
  kompassiProgramItem.cachedDimensions["uses-gen-ai"][0] === KompassiYesNo.YES;
