import dayjs from "dayjs";
import { uniq } from "lodash-es";
import {
  ProgramItem,
  Language,
  ProgramType,
  Tag,
  SignupType,
} from "shared/types/models/programItem";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import {
  KompassiProgramItemHitpoint,
  KompassiProgramTypeHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import { config } from "shared/config";

export const kompassiProgramItemMapperHitpoint = (
  programItems: readonly KompassiProgramItemHitpoint[],
): readonly ProgramItem[] => {
  return programItems.map((programItem) => {
    return {
      programItemId: programItem.slug,
      title: programItem.title,
      description: programItem.description,
      location: programItem.room_name,
      startTime: dayjs(programItem.start_time).toISOString(),
      mins: programItem.length,
      tags: mapTags(programItem),
      genres: [],
      styles: [],
      languages: mapLanguages(programItem),
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
      signupType: SignupType.KONSTI,
    };
  });
};

const mapProgramType = (
  kompassiProgramItem: KompassiProgramItemHitpoint,
): ProgramType => {
  const programType = kompassiProgramItem.category_title;

  switch (programType) {
    case KompassiProgramTypeHitpoint.TABLETOP_RPG:
      return ProgramType.TABLETOP_RPG;

    case KompassiProgramTypeHitpoint.LARP:
      return ProgramType.LARP;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};

const mapTags = (kompassiProgramItem: KompassiProgramItemHitpoint): Tag[] => {
  const tags = [];

  if (kompassiProgramItem.is_age_restricted) {
    tags.push(Tag.FOR_18_PLUS_ONLY);
  }

  if (kompassiProgramItem.is_beginner_friendly) {
    tags.push(Tag.BEGINNER_FRIENDLY);
  }

  if (kompassiProgramItem.is_children_friendly) {
    tags.push(Tag.CHILDREN_FRIENDLY);
  }

  if (kompassiProgramItem.is_intended_for_experienced_participants) {
    tags.push(Tag.INTENDED_FOR_EXPERIENCED_PARTICIPANTS);
  }

  return uniq(tags);
};

const mapLanguages = (
  kompassiProgramItem: KompassiProgramItemHitpoint,
): Language[] => {
  const { isEnglishProgramItems } = config.shared();

  if (isEnglishProgramItems.includes(kompassiProgramItem.slug)) {
    return [Language.ENGLISH];
  }

  if (kompassiProgramItem.is_english_ok) {
    return [Language.ENGLISH];
  }

  return [Language.FINNISH];
};
