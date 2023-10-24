import _ from "lodash";
import dayjs from "dayjs";
import {
  AccessibilityValue,
  Game,
  GameStyle,
  Genre,
  Language,
  ProgramType,
  Tag,
} from "shared/typings/models/game";
import {
  KompassiGameRopecon,
  KompassiGameStyleRopecon,
  KompassiGenreRopecon,
  KompassiLanguageRopecon,
  KompassiProgramTypeRopecon,
  KompassiTagRopecon,
  workshopProgramTypesRopecon,
} from "shared/typings/models/kompassiGame/kompassiGameRopecon";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { config } from "shared/config";

export const kompassiGameMapper = (
  games: readonly KompassiGameRopecon[],
): readonly Game[] => {
  return games.map((game) => {
    return {
      gameId: game.identifier,
      title: game.title,
      description: game.description,
      location: game.room_name,
      startTime: dayjs(game.start_time).toISOString(),
      mins:
        game.length ||
        dayjs(game.end_time).diff(dayjs(game.start_time), "minute"),
      tags: mapTags(game),
      genres: mapGenres(game),
      styles: mapGameStyles(game),
      language: mapLanguage(game.ropecon2023_language),
      endTime: dayjs(game.end_time).toISOString(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players || game.ropecon2018_characters,
      gameSystem: game.rpg_system,
      shortDescription: game.short_blurb,
      revolvingDoor: mapRevolvingDoor(game),
      programType: mapProgramType(game),
      contentWarnings: game.ropecon2022_content_warnings,
      otherAuthor: game.other_author,
      accessibilityValues: mapAccessibilityValues(game),
      popularity: 0,
      otherAccessibilityInformation:
        game.ropecon2023_other_accessibility_information,
      entryFee: game.ropecon2023_workshop_fee,
      signupType: game.ropecon2023_signuplist,
    };
  });
};

const mapProgramType = (kompassiGame: KompassiGameRopecon): ProgramType => {
  const programType = kompassiGame.category_title;

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

const mapTags = (kompassiGame: KompassiGameRopecon): Tag[] => {
  const tags: Tag[] = kompassiGame.tags.flatMap((tag) => {
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

  if (kompassiGame.ropecon2023_suitable_for_all_ages) {
    tags.push(Tag.SUITABLE_FOR_ALL_AGES);
  }

  if (kompassiGame.ropecon2023_aimed_at_children_under_13) {
    tags.push(Tag.AIMED_AT_CHILDREN_UNDER_13);
  }

  if (kompassiGame.ropecon2023_aimed_at_children_between_13_17) {
    tags.push(Tag.AIMED_AT_CHILDREN_BETWEEN_13_17);
  }

  if (kompassiGame.ropecon2023_aimed_at_adult_attendees) {
    tags.push(Tag.AIMED_AT_ADULT_ATTENDEES);
  }

  if (kompassiGame.ropecon2023_for_18_plus_only) {
    tags.push(Tag.FOR_18_PLUS_ONLY);
  }

  if (kompassiGame.ropecon2023_beginner_friendly) {
    tags.push(Tag.BEGINNER_FRIENDLY);
  }

  if (kompassiGame.ropecon_theme) {
    tags.push(Tag.ROPECON_THEME);
  }

  if (kompassiGame.ropecon2023_celebratory_year) {
    tags.push(Tag.CELEBRATORY_YEAR);
  }

  return _.uniq(tags);
};

const mapGenres = (kompassiGame: KompassiGameRopecon): Genre[] => {
  return kompassiGame.genres.map((genre) => {
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

const mapGameStyles = (kompassiGame: KompassiGameRopecon): GameStyle[] => {
  return kompassiGame.styles.map((gameStyle) => {
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
  kompassiGame: KompassiGameRopecon,
): AccessibilityValue[] => {
  const accessibilityValues = [];

  if (kompassiGame.ropecon2021_accessibility_loud_sounds) {
    accessibilityValues.push(AccessibilityValue.LOUD_SOUNDS);
  }

  if (kompassiGame.ropecon2021_accessibility_flashing_lights) {
    accessibilityValues.push(AccessibilityValue.FLASHING_LIGHTS);
  }

  if (kompassiGame.ropecon2021_accessibility_strong_smells) {
    accessibilityValues.push(AccessibilityValue.STRONG_SMELLS);
  }

  if (kompassiGame.ropecon2021_accessibility_irritate_skin) {
    accessibilityValues.push(AccessibilityValue.IRRITATE_SKIN);
  }

  if (kompassiGame.ropecon2021_accessibility_physical_contact) {
    accessibilityValues.push(AccessibilityValue.PHYSICAL_CONTACT);
  }

  if (kompassiGame.ropecon2021_accessibility_low_lightning) {
    accessibilityValues.push(AccessibilityValue.LOW_LIGHTING);
  }

  if (kompassiGame.ropecon2021_accessibility_moving_around) {
    accessibilityValues.push(AccessibilityValue.MOVING_AROUND);
  }

  if (kompassiGame.ropecon2021_accessibility_video) {
    accessibilityValues.push(AccessibilityValue.VIDEO);
  }

  if (kompassiGame.ropecon2021_accessibility_recording) {
    accessibilityValues.push(AccessibilityValue.RECORDING);
  }

  if (kompassiGame.ropecon2021_accessibility_colourblind) {
    accessibilityValues.push(AccessibilityValue.COLOURBLIND);
  }

  if (kompassiGame.ropecon2022_accessibility_remaining_one_place) {
    accessibilityValues.push(AccessibilityValue.REMAINING_ONE_PLACE);
  }

  if (kompassiGame.ropecon2023_accessibility_cant_use_mic) {
    accessibilityValues.push(AccessibilityValue.CANNOT_USE_MIC);
  }

  if (kompassiGame.ropecon2023_accessibility_programme_duration_over_2_hours) {
    accessibilityValues.push(
      AccessibilityValue.PROGRAMME_DURATION_OVER_2_HOURS,
    );
  }

  if (
    kompassiGame.ropecon2023_accessibility_limited_opportunities_to_move_around
  ) {
    accessibilityValues.push(
      AccessibilityValue.LIMITED_OPPORTUNITIES_TO_MOVE_AROUND,
    );
  }

  if (kompassiGame.ropecon2023_accessibility_long_texts) {
    accessibilityValues.push(AccessibilityValue.LONG_TEXT);
  }

  if (
    kompassiGame.ropecon2023_accessibility_texts_not_available_as_recordings
  ) {
    accessibilityValues.push(
      AccessibilityValue.TEXT_NOT_AVAILABLE_AS_RECORDINGS,
    );
  }

  if (kompassiGame.ropecon2023_accessibility_participation_requires_dexterity) {
    accessibilityValues.push(
      AccessibilityValue.PARTICIPATION_REQUIRES_DEXTERITY,
    );
  }

  if (
    kompassiGame.ropecon2023_accessibility_participation_requires_react_quickly
  ) {
    accessibilityValues.push(
      AccessibilityValue.PARTICIPATION_REQUIRES_REACT_QUICKLY,
    );
  }

  return accessibilityValues;
};

const mapRevolvingDoor = (kompassiGame: KompassiGameRopecon): boolean => {
  if (kompassiGame.revolving_door) {
    return true;
  }

  if (
    workshopProgramTypesRopecon.includes(kompassiGame.category_title) &&
    kompassiGame.max_players === 0
  ) {
    return true;
  }

  if (config.shared().addRevolvingDoorIds.includes(kompassiGame.identifier)) {
    return true;
  }

  return false;
};
