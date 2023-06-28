import _ from "lodash";
import dayjs from "dayjs";
import {
  AccessibilityValue,
  Game,
  GameStyle,
  Genre,
  ProgramType,
  Tag,
} from "shared/typings/models/game";
import {
  KompassiGame,
  KompassiGameStyle,
  KompassiGenre,
  KompassiProgramType,
  KompassiTag,
} from "shared/typings/models/kompassiGame";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export const kompassiGameMapper = (
  games: readonly KompassiGame[]
): readonly Game[] => {
  return games.map((game) => {
    return {
      gameId: game.identifier,
      title: game.title,
      description: game.description,
      location: game.room_name,
      startTime: dayjs(game.start_time).format(),
      mins:
        game.length ||
        dayjs(game.end_time).diff(dayjs(game.start_time), "minute"),
      tags: mapTags(game),
      genres: mapGenres(game),
      styles: mapGameStyles(game),
      language: game.ropecon2023_language,
      endTime: dayjs(game.end_time).format(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players || game.ropecon2018_characters,
      gameSystem: game.rpg_system,
      shortDescription: game.short_blurb,
      revolvingDoor: game.revolving_door,
      programType: mapProgramType(game),
      contentWarnings: game.ropecon2022_content_warnings,
      otherAuthor: game.other_author,
      accessibilityValues: mapAccessibilityValues(game),
      popularity: 0,
      otherInaccessibility: game.ropecon2023_other_accessibility_information,
      entryFee: game.ropecon2023_workshop_fee,
      signupType: game.ropecon2023_signuplist,
    };
  });
};

const mapProgramType = (kompassiGame: KompassiGame): ProgramType => {
  const programType = kompassiGame.category_title;

  switch (programType) {
    case KompassiProgramType.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiProgramType.LARP:
      return ProgramType.LARP;

    case KompassiProgramType.TOURNAMENT_BOARD_GAME:
    case KompassiProgramType.TOURNAMENT_CARD_GAME:
    case KompassiProgramType.TOURNAMENT_MINIATURE_WARGAME:
    case KompassiProgramType.TOURNAMENT_OTHER:
      return ProgramType.TOURNAMENT;

    case KompassiProgramType.WORKSHOP_MINIATURE:
    case KompassiProgramType.WORKSHOP_CRAFTS:
    case KompassiProgramType.WORKSHOP_MUSIC:
    case KompassiProgramType.WORKSHOP_OTHER:
      return ProgramType.WORKSHOP;

    case KompassiProgramType.EXPERIENCE_POINT_DEMO:
    case KompassiProgramType.EXPERIENCE_POINT_OTHER:
    case KompassiProgramType.EXPERIENCE_POINT_OPEN:
      return ProgramType.EXPERIENCE_POINT;

    case KompassiProgramType.OTHER_GAME_PROGRAM:
    case KompassiProgramType.OTHER_PROGRAM:
      return ProgramType.OTHER;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiGame: KompassiGame): Tag[] => {
  const tags: Tag[] = kompassiGame.tags.flatMap((tag) => {
    switch (tag) {
      case KompassiTag.IN_ENGLISH:
        return Tag.IN_ENGLISH;

      case KompassiTag.SOPII_LAPSILLE:
        return Tag.CHILDREN_FRIENDLY;

      case KompassiTag.VAIN_TAYSI_IKAISILLE:
        return Tag.AGE_RESTRICTED;

      case KompassiTag.ALOITTELIJAYSTÄVÄLLINEN:
        return Tag.BEGINNER_FRIENDLY;

      case KompassiTag.KUNNIAVIERAS:
        return Tag.GUEST_OF_HONOR;

      case KompassiTag.PERHEOHJELMA:
        return Tag.FAMILY;

      case KompassiTag.TEEMA_ELEMENTIT:
        return Tag.THEME_ELEMENTS;

      case KompassiTag.SOPII_ALLE_7V:
        return Tag.SUITABLE_UNDER_7;

      case KompassiTag.SOPII_7_12V:
        return Tag.SUITABLE_7_TO_12;

      case KompassiTag.SOPII_YLI_12V:
        return Tag.SUITABLE_OVER_12;

      case KompassiTag.EI_SOVELLU_ALLE_15V:
        return Tag.NOT_SUITABLE_UNDER_15;

      case KompassiTag.LASTENOHJELMA:
        return Tag.CHILDRENS_PROGRAM;

      case KompassiTag.SUUNNATTU_ALLE_10V:
        return Tag.SUITABLE_UNDER_10;

      case KompassiTag.SUUNNATTU_ALAIKAISILLE:
        return Tag.FOR_MINORS;

      case KompassiTag.SUUNNATTU_TAYSIIKAISILLE:
        return Tag.FOR_ADULTS;

      case KompassiTag.TEEMA_YSTAVYYS:
        return Tag.THEME_FRIENDSHIP;

      case KompassiTag.DEMO:
        return Tag.DEMO;

      case KompassiTag.KILPAILUTURNAUS:
        return Tag.TOURNAMENT;

      // We don't want to show these in UI
      case KompassiTag.AIHE_FIGUPELIT:
      case KompassiTag.AIHE_KORTTIPELIT:
      case KompassiTag.AIHE_LARPIT:
      case KompassiTag.AIHE_LAUTAPELIT:
      case KompassiTag.AIHE_POYTAROOLIPELIT:
      case KompassiTag.HISTORIA:
      case KompassiTag.PELI:
      case KompassiTag.YOUTUBE:
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

const mapGenres = (kompassiGame: KompassiGame): Genre[] => {
  return kompassiGame.genres.map((genre) => {
    switch (genre) {
      case KompassiGenre.FANTASY:
        return Genre.FANTASY;

      case KompassiGenre.SCIFI:
        return Genre.SCIFI;

      case KompassiGenre.HISTORICAL:
        return Genre.HISTORICAL;

      case KompassiGenre.MODERN:
        return Genre.MODERN;

      case KompassiGenre.WAR:
        return Genre.WAR;

      case KompassiGenre.HORROR:
        return Genre.HORROR;

      case KompassiGenre.EXPLORATION:
        return Genre.EXPLORATION;

      case KompassiGenre.MYSTERY:
        return Genre.MYSTERY;

      case KompassiGenre.DRAMA:
        return Genre.DRAMA;

      case KompassiGenre.HUMOR:
        return Genre.HUMOR;

      case KompassiGenre.ADVENTURE:
        return Genre.ADVENTURE;

      default:
        return exhaustiveSwitchGuard(genre);
    }
  });
};

const mapGameStyles = (kompassiGame: KompassiGame): GameStyle[] => {
  return kompassiGame.styles.map((gameStyle) => {
    switch (gameStyle) {
      case KompassiGameStyle.SERIOUS:
        return GameStyle.SERIOUS;

      case KompassiGameStyle.LIGHT:
        return GameStyle.LIGHT;

      case KompassiGameStyle.RULES_HEAVY:
        return GameStyle.RULES_HEAVY;

      case KompassiGameStyle.RULES_LIGHT:
        return GameStyle.RULES_LIGHT;

      case KompassiGameStyle.STORY_DRIVEN:
        return GameStyle.STORY_DRIVEN;

      case KompassiGameStyle.CHARACTER_DRIVEN:
        return GameStyle.CHARACTER_DRIVEN;

      case KompassiGameStyle.COMBAT_DRIVEN:
        return GameStyle.COMBAT_DRIVEN;

      default:
        return exhaustiveSwitchGuard(gameStyle);
    }
  });
};

const mapAccessibilityValues = (
  kompassiGame: KompassiGame
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

  if (kompassiGame.ropecon2021_accessibility_text) {
    accessibilityValues.push(AccessibilityValue.TEXT);
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
      AccessibilityValue.PROGRAMME_DURATION_OVER_2_HOURS
    );
  }

  if (
    kompassiGame.ropecon2023_accessibility_limited_opportunities_to_move_around
  ) {
    accessibilityValues.push(
      AccessibilityValue.LIMITED_OPPORTUNITIES_TO_MOVE_AROUND
    );
  }

  if (kompassiGame.ropecon2023_accessibility_long_texts) {
    accessibilityValues.push(AccessibilityValue.LONG_TEXT);
  }

  if (
    kompassiGame.ropecon2023_accessibility_texts_not_available_as_recordings
  ) {
    accessibilityValues.push(
      AccessibilityValue.TEXT_NOT_AVAILABLE_AS_RECORDINGS
    );
  }

  if (kompassiGame.ropecon2023_accessibility_participation_requires_dexterity) {
    accessibilityValues.push(
      AccessibilityValue.PARTICIPATION_REQUIRES_DEXTERITY
    );
  }

  if (
    kompassiGame.ropecon2023_accessibility_participation_requires_react_quickly
  ) {
    accessibilityValues.push(
      AccessibilityValue.PARTICIPATION_REQUIRES_REACT_QUICKLY
    );
  }

  return accessibilityValues;
};
