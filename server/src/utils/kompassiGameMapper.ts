import { uniq } from "lodash";
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
      mins: game.length,
      tags: mapTags(game),
      genres: mapGenres(game),
      styles: mapGameStyles(game),
      language: game.language,
      endTime:
        dayjs(game.end_time).format() ||
        dayjs(game.start_time).add(game.length, "minutes").format(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players || game.ropecon2018_characters,
      gameSystem: game.rpg_system,
      shortDescription: game.short_blurb || game.three_word_description,
      revolvingDoor: game.revolving_door,
      programType: mapProgramType(game),
      contentWarnings: game.content_warnings,
      otherAuthor: game.other_author,
      accessibilityValues: mapAccessibilityValues(game),
      popularity: 0,
    };
  });
};

const mapProgramType = (kompassiGame: KompassiGame): ProgramType => {
  const programType = kompassiGame.category_title;

  switch (programType) {
    case KompassiProgramType.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiProgramType.FREEFORM_RPG:
      return ProgramType.FREEFORM_RPG;

    case KompassiProgramType.LARP:
      return ProgramType.LARP;

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

      default:
        return exhaustiveSwitchGuard(tag);
    }
  });

  if (kompassiGame.intended_for_experienced_participants) {
    tags.push(Tag.FOR_EXPERIENCED_PARTICIPANTS);
  }

  if (kompassiGame.english_ok) {
    tags.push(Tag.IN_ENGLISH);
  }

  if (kompassiGame.children_friendly) {
    tags.push(Tag.CHILDREN_FRIENDLY);
  }

  if (kompassiGame.age_restricted) {
    tags.push(Tag.AGE_RESTRICTED);
  }

  if (kompassiGame.beginner_friendly) {
    tags.push(Tag.BEGINNER_FRIENDLY);
  }

  if (kompassiGame.is_beginner_friendly) {
    tags.push(Tag.BEGINNER_FRIENDLY);
  }

  return uniq(tags);
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

  return accessibilityValues;
};
