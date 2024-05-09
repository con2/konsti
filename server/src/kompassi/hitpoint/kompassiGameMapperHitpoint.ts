import dayjs from "dayjs";
import { uniq } from "lodash-es";
import {
  ProgramItem,
  Language,
  ProgramType,
  Tag,
} from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  KompassiGameHitpoint,
  KompassiProgramTypeHitpoint,
} from "server/kompassi/hitpoint/kompassiGameHitpoint";
import { config } from "shared/config";

export const kompassiGameMapperHitpoint = (
  games: readonly KompassiGameHitpoint[],
): readonly ProgramItem[] => {
  return games.map((game) => {
    return {
      programItemId: game.identifier,
      title: game.title,
      description: game.description,
      location: game.room_name,
      startTime: dayjs(game.start_time).toISOString(),
      mins: game.length,
      tags: mapTags(game),
      genres: [],
      styles: [],
      language: mapLanguage(game),
      endTime: dayjs(game.start_time).add(game.length, "minutes").toISOString(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players,
      gameSystem: game.rpg_system,
      shortDescription: game.three_word_description,
      revolvingDoor: false,
      programType: mapProgramType(game),
      contentWarnings: "",
      otherAuthor: game.other_author,
      accessibilityValues: [],
      popularity: 0,
      otherAccessibilityInformation: "",
      entryFee: "",
      signupType: "",
    };
  });
};

const mapProgramType = (kompassiGame: KompassiGameHitpoint): ProgramType => {
  const programType = kompassiGame.category_title;

  switch (programType) {
    case KompassiProgramTypeHitpoint.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiProgramTypeHitpoint.LARP:
      return ProgramType.LARP;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiGame: KompassiGameHitpoint): Tag[] => {
  const tags = [];

  if (kompassiGame.is_age_restricted) {
    tags.push(Tag.FOR_18_PLUS_ONLY);
  }

  if (kompassiGame.is_beginner_friendly) {
    tags.push(Tag.BEGINNER_FRIENDLY);
  }

  if (kompassiGame.is_children_friendly) {
    tags.push(Tag.CHILDREN_FRIENDLY);
  }

  if (kompassiGame.is_intended_for_experienced_participants) {
    tags.push(Tag.INTENDED_FOR_EXPERIENCED_PARTICIPANTS);
  }

  return uniq(tags);
};

const mapLanguage = (kompassiGame: KompassiGameHitpoint) => {
  const { isEnglishProgramItems } = config.shared();

  if (isEnglishProgramItems.includes(kompassiGame.identifier)) {
    return Language.ENGLISH;
  }

  if (kompassiGame.is_english_ok) {
    return Language.FINNISH_OR_ENGLISH;
  }

  return Language.FINNISH;
};
