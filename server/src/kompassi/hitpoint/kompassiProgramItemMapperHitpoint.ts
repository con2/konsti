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
  kompassiProgramItemHitpoint,
  KompassiProgramTypeHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import { config } from "shared/config";

export const kompassiProgramItemMapperHitpoint = (
  programItems: readonly kompassiProgramItemHitpoint[],
): readonly ProgramItem[] => {
  return programItems.map((programItem) => {
    return {
      programItemId: programItem.identifier,
      title: programItem.title,
      description: programItem.description,
      location: programItem.room_name,
      startTime: dayjs(programItem.start_time).toISOString(),
      mins: programItem.length,
      tags: mapTags(programItem),
      genres: [],
      styles: [],
      language: mapLanguage(programItem),
      endTime: dayjs(programItem.start_time)
        .add(programItem.length, "minutes")
        .toISOString(),
      people: programItem.formatted_hosts,
      minAttendance: programItem.min_players,
      maxAttendance: programItem.max_players,
      gameSystem: programItem.rpg_system,
      shortDescription: programItem.three_word_description,
      revolvingDoor: false,
      programType: mapProgramType(programItem),
      contentWarnings: "",
      otherAuthor: programItem.other_author,
      accessibilityValues: [],
      popularity: 0,
      otherAccessibilityInformation: "",
      entryFee: "",
      signupType: "",
    };
  });
};

const mapProgramType = (
  kompassiGame: kompassiProgramItemHitpoint,
): ProgramType => {
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

const mapTags = (kompassiGame: kompassiProgramItemHitpoint): Tag[] => {
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

const mapLanguage = (kompassiGame: kompassiProgramItemHitpoint) => {
  const { isEnglishProgramItems } = config.shared();

  if (isEnglishProgramItems.includes(kompassiGame.identifier)) {
    return Language.ENGLISH;
  }

  if (kompassiGame.is_english_ok) {
    return Language.FINNISH_OR_ENGLISH;
  }

  return Language.FINNISH;
};
