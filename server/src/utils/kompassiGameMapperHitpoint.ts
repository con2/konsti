import dayjs from "dayjs";
import _ from "lodash";
import { Game, Language, ProgramType, Tag } from "shared/typings/models/game";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  KompassiGameHitpoint,
  KompassiProgramTypeHitpoint,
} from "shared/typings/models/kompassiGame/kompassiGameHitpoint";

export const kompassiGameMapperHitpoint = (
  games: readonly KompassiGameHitpoint[],
): readonly Game[] => {
  return games.map((game) => {
    return {
      gameId: game.identifier,
      title: game.title,
      description: game.description,
      location: game.room_name,
      startTime: dayjs(game.start_time).toISOString(),
      mins: game.length,
      tags: mapTags(game),
      genres: [],
      styles: [],
      language: game.is_english_ok
        ? Language.FINNISH_OR_ENGLISH
        : Language.FINNISH,
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

  return _.uniq(tags);
};
