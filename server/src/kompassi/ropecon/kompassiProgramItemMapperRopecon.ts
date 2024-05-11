import { uniq } from "lodash-es";
import dayjs from "dayjs";
import {
  AccessibilityValue,
  ProgramItem,
  GameStyle,
  Genre,
  Language,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import {
  KompassiProgramItemRopecon,
  KompassiGameStyleRopecon,
  KompassiGenreRopecon,
  KompassiLanguageRopecon,
  KompassiProgramTypeRopecon,
  KompassiTagRopecon,
  workshopProgramTypesRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";

export const kompassiProgramItemMapperRopecon = (
  programItems: readonly KompassiProgramItemRopecon[],
): readonly ProgramItem[] => {
  return programItems.map((programItem) => {
    return {
      programItemId: programItem.identifier,
      title: programItem.title,
      description: programItem.description,
      location: programItem.room_name,
      startTime: dayjs(programItem.start_time).toISOString(),
      mins:
        programItem.length ||
        dayjs(programItem.end_time).diff(
          dayjs(programItem.start_time),
          "minute",
        ),
      tags: mapTags(programItem),
      genres: mapGenres(programItem),
      styles: mapGameStyles(programItem),
      language: mapLanguage(programItem.ropecon2023_language),
      endTime: dayjs(programItem.end_time).toISOString(),
      people: programItem.formatted_hosts,
      minAttendance: programItem.min_players,
      maxAttendance:
        programItem.max_players || programItem.ropecon2018_characters,
      gameSystem: programItem.rpg_system,
      shortDescription: programItem.short_blurb,
      revolvingDoor: mapRevolvingDoor(programItem),
      programType: mapProgramType(programItem),
      contentWarnings: programItem.ropecon2022_content_warnings,
      otherAuthor: programItem.other_author,
      accessibilityValues: mapAccessibilityValues(programItem),
      popularity: 0,
      otherAccessibilityInformation:
        programItem.ropecon2023_other_accessibility_information,
      entryFee: programItem.ropecon2023_workshop_fee,
      signupType: programItem.ropecon2023_signuplist,
    };
  });
};

const mapProgramType = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): ProgramType => {
  const programType = kompassiProgramItem.category_title;

  switch (programType) {
    case KompassiProgramTypeRopecon.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiProgramTypeRopecon.LARP:
      return ProgramType.LARP;

    case KompassiProgramTypeRopecon.TOURNAMENT_BOARD_GAME:
    case KompassiProgramTypeRopecon.TOURNAMENT_CARD_GAME:
    case KompassiProgramTypeRopecon.TOURNAMENT_MINIATURE_WARGAME:
    case KompassiProgramTypeRopecon.TOURNAMENT_OTHER:
      return ProgramType.TOURNAMENT;

    case KompassiProgramTypeRopecon.WORKSHOP_MINIATURE:
    case KompassiProgramTypeRopecon.WORKSHOP_CRAFTS:
    case KompassiProgramTypeRopecon.WORKSHOP_MUSIC:
    case KompassiProgramTypeRopecon.WORKSHOP_OTHER:
      return ProgramType.WORKSHOP;

    case KompassiProgramTypeRopecon.EXPERIENCE_POINT_DEMO:
    case KompassiProgramTypeRopecon.EXPERIENCE_POINT_OTHER:
    case KompassiProgramTypeRopecon.EXPERIENCE_POINT_OPEN:
      return ProgramType.EXPERIENCE_POINT;

    case KompassiProgramTypeRopecon.OTHER_GAME_PROGRAM:
    case KompassiProgramTypeRopecon.OTHER_PROGRAM:
    case KompassiProgramTypeRopecon.MINIATURE_DEMO:
      return ProgramType.OTHER;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiProgramItem: KompassiProgramItemRopecon): Tag[] => {
  const tags: Tag[] = kompassiProgramItem.tags.flatMap((tag) => {
    switch (tag) {
      case KompassiTagRopecon.IN_ENGLISH:
        return Tag.IN_ENGLISH;

      case KompassiTagRopecon.SOPII_LAPSILLE:
        return Tag.CHILDREN_FRIENDLY;

      case KompassiTagRopecon.VAIN_TAYSI_IKAISILLE:
        return Tag.AGE_RESTRICTED;

      case KompassiTagRopecon.ALOITTELIJAYSTÄVÄLLINEN:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiTagRopecon.KUNNIAVIERAS:
        return Tag.GUEST_OF_HONOR;

      case KompassiTagRopecon.PERHEOHJELMA:
        return Tag.FAMILY;

      case KompassiTagRopecon.TEEMA_ELEMENTIT:
        return Tag.THEME_ELEMENTS;

      case KompassiTagRopecon.SOPII_ALLE_7V:
        return Tag.SUITABLE_UNDER_7;

      case KompassiTagRopecon.SOPII_7_12V:
        return Tag.SUITABLE_7_TO_12;

      case KompassiTagRopecon.SOPII_YLI_12V:
        return Tag.SUITABLE_OVER_12;

      case KompassiTagRopecon.EI_SOVELLU_ALLE_15V:
        return Tag.NOT_SUITABLE_UNDER_15;

      case KompassiTagRopecon.LASTENOHJELMA:
        return Tag.CHILDRENS_PROGRAM;

      case KompassiTagRopecon.SUUNNATTU_ALLE_10V:
        return Tag.SUITABLE_UNDER_10;

      case KompassiTagRopecon.SUUNNATTU_ALAIKAISILLE:
        return Tag.FOR_MINORS;

      case KompassiTagRopecon.SUUNNATTU_TAYSIIKAISILLE:
        return Tag.FOR_ADULTS;

      case KompassiTagRopecon.TEEMA_YSTAVYYS:
        return Tag.THEME_FRIENDSHIP;

      case KompassiTagRopecon.DEMO:
        return Tag.DEMO;

      case KompassiTagRopecon.KILPAILUTURNAUS:
        return Tag.TOURNAMENT;

      // We don't want to show these in UI
      case KompassiTagRopecon.AIHE_FIGUPELIT:
      case KompassiTagRopecon.AIHE_KORTTIPELIT:
      case KompassiTagRopecon.AIHE_LARPIT:
      case KompassiTagRopecon.AIHE_LAUTAPELIT:
      case KompassiTagRopecon.AIHE_POYTAROOLIPELIT:
      case KompassiTagRopecon.HISTORIA:
      case KompassiTagRopecon.PELI:
      case KompassiTagRopecon.YOUTUBE:
        return [];

      default:
        return exhaustiveSwitchGuard(tag);
    }
  });

  if (kompassiProgramItem.ropecon2023_suitable_for_all_ages) {
    tags.push(Tag.SUITABLE_FOR_ALL_AGES);
  }

  if (kompassiProgramItem.ropecon2023_aimed_at_children_under_13) {
    tags.push(Tag.AIMED_AT_CHILDREN_UNDER_13);
  }

  if (kompassiProgramItem.ropecon2023_aimed_at_children_between_13_17) {
    tags.push(Tag.AIMED_AT_CHILDREN_BETWEEN_13_17);
  }

  if (kompassiProgramItem.ropecon2023_aimed_at_adult_attendees) {
    tags.push(Tag.AIMED_AT_ADULT_ATTENDEES);
  }

  if (kompassiProgramItem.ropecon2023_for_18_plus_only) {
    tags.push(Tag.FOR_18_PLUS_ONLY);
  }

  if (kompassiProgramItem.ropecon2023_beginner_friendly) {
    tags.push(Tag.BEGINNER_FRIENDLY);
  }

  if (kompassiProgramItem.ropecon_theme) {
    tags.push(Tag.ROPECON_THEME);
  }

  if (kompassiProgramItem.ropecon2023_celebratory_year) {
    tags.push(Tag.CELEBRATORY_YEAR);
  }

  return uniq(tags);
};

const mapGenres = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): Genre[] => {
  return kompassiProgramItem.genres.map((genre) => {
    switch (genre) {
      case KompassiGenreRopecon.FANTASY:
        return Genre.FANTASY;

      case KompassiGenreRopecon.SCIFI:
        return Genre.SCIFI;

      case KompassiGenreRopecon.HISTORICAL:
        return Genre.HISTORICAL;

      case KompassiGenreRopecon.MODERN:
        return Genre.MODERN;

      case KompassiGenreRopecon.WAR:
        return Genre.WAR;

      case KompassiGenreRopecon.HORROR:
        return Genre.HORROR;

      case KompassiGenreRopecon.EXPLORATION:
        return Genre.EXPLORATION;

      case KompassiGenreRopecon.MYSTERY:
        return Genre.MYSTERY;

      case KompassiGenreRopecon.DRAMA:
        return Genre.DRAMA;

      case KompassiGenreRopecon.HUMOR:
        return Genre.HUMOR;

      case KompassiGenreRopecon.ADVENTURE:
        return Genre.ADVENTURE;

      default:
        return exhaustiveSwitchGuard(genre);
    }
  });
};

const mapGameStyles = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): GameStyle[] => {
  return kompassiProgramItem.styles.map((gameStyle) => {
    switch (gameStyle) {
      case KompassiGameStyleRopecon.SERIOUS:
        return GameStyle.SERIOUS;

      case KompassiGameStyleRopecon.LIGHT:
        return GameStyle.LIGHT;

      case KompassiGameStyleRopecon.RULES_HEAVY:
        return GameStyle.RULES_HEAVY;

      case KompassiGameStyleRopecon.RULES_LIGHT:
        return GameStyle.RULES_LIGHT;

      case KompassiGameStyleRopecon.STORY_DRIVEN:
        return GameStyle.STORY_DRIVEN;

      case KompassiGameStyleRopecon.CHARACTER_DRIVEN:
        return GameStyle.CHARACTER_DRIVEN;

      case KompassiGameStyleRopecon.COMBAT_DRIVEN:
        return GameStyle.COMBAT_DRIVEN;

      default:
        return exhaustiveSwitchGuard(gameStyle);
    }
  });
};

const mapLanguage = (kompassiLanguage: KompassiLanguageRopecon): Language => {
  switch (kompassiLanguage) {
    case KompassiLanguageRopecon.FINNISH:
      return Language.FINNISH;

    case KompassiLanguageRopecon.ENGLISH:
      return Language.ENGLISH;

    case KompassiLanguageRopecon.FINNISH_OR_ENGLISH:
      return Language.FINNISH_OR_ENGLISH;

    case KompassiLanguageRopecon.LANGUAGE_FREE:
      return Language.LANGUAGE_FREE;

    default:
      return exhaustiveSwitchGuard(kompassiLanguage);
  }
};

const mapAccessibilityValues = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): AccessibilityValue[] => {
  const accessibilityValues = [];

  if (kompassiProgramItem.ropecon2021_accessibility_loud_sounds) {
    accessibilityValues.push(AccessibilityValue.LOUD_SOUNDS);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_flashing_lights) {
    accessibilityValues.push(AccessibilityValue.FLASHING_LIGHTS);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_strong_smells) {
    accessibilityValues.push(AccessibilityValue.STRONG_SMELLS);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_irritate_skin) {
    accessibilityValues.push(AccessibilityValue.IRRITATE_SKIN);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_physical_contact) {
    accessibilityValues.push(AccessibilityValue.PHYSICAL_CONTACT);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_low_lightning) {
    accessibilityValues.push(AccessibilityValue.LOW_LIGHTING);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_moving_around) {
    accessibilityValues.push(AccessibilityValue.MOVING_AROUND);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_video) {
    accessibilityValues.push(AccessibilityValue.VIDEO);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_recording) {
    accessibilityValues.push(AccessibilityValue.RECORDING);
  }

  if (kompassiProgramItem.ropecon2021_accessibility_colourblind) {
    accessibilityValues.push(AccessibilityValue.COLOURBLIND);
  }

  if (kompassiProgramItem.ropecon2022_accessibility_remaining_one_place) {
    accessibilityValues.push(AccessibilityValue.REMAINING_ONE_PLACE);
  }

  if (kompassiProgramItem.ropecon2023_accessibility_cant_use_mic) {
    accessibilityValues.push(AccessibilityValue.CANNOT_USE_MIC);
  }

  if (
    kompassiProgramItem.ropecon2023_accessibility_programme_duration_over_2_hours
  ) {
    accessibilityValues.push(
      AccessibilityValue.PROGRAMME_DURATION_OVER_2_HOURS,
    );
  }

  if (
    kompassiProgramItem.ropecon2023_accessibility_limited_opportunities_to_move_around
  ) {
    accessibilityValues.push(
      AccessibilityValue.LIMITED_OPPORTUNITIES_TO_MOVE_AROUND,
    );
  }

  if (kompassiProgramItem.ropecon2023_accessibility_long_texts) {
    accessibilityValues.push(AccessibilityValue.LONG_TEXT);
  }

  if (
    kompassiProgramItem.ropecon2023_accessibility_texts_not_available_as_recordings
  ) {
    accessibilityValues.push(
      AccessibilityValue.TEXT_NOT_AVAILABLE_AS_RECORDINGS,
    );
  }

  if (
    kompassiProgramItem.ropecon2023_accessibility_participation_requires_dexterity
  ) {
    accessibilityValues.push(
      AccessibilityValue.PARTICIPATION_REQUIRES_DEXTERITY,
    );
  }

  if (
    kompassiProgramItem.ropecon2023_accessibility_participation_requires_react_quickly
  ) {
    accessibilityValues.push(
      AccessibilityValue.PARTICIPATION_REQUIRES_REACT_QUICKLY,
    );
  }

  return accessibilityValues;
};

const mapRevolvingDoor = (
  kompassiProgramItem: KompassiProgramItemRopecon,
): boolean => {
  if (kompassiProgramItem.revolving_door) {
    return true;
  }

  if (
    workshopProgramTypesRopecon.includes(kompassiProgramItem.category_title) &&
    kompassiProgramItem.max_players === 0
  ) {
    return true;
  }

  if (
    config.shared().addRevolvingDoorIds.includes(kompassiProgramItem.identifier)
  ) {
    return true;
  }

  return false;
};
