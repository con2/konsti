import dayjs from "dayjs";
import {
  ProgramItem,
  Language,
  ProgramType,
} from "shared/types/models/programItem";
import {
  KompassiProgramItemSolmukohta,
  KompassiProgramTypeSolmukohta,
} from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export const kompassiProgramItemMapperSolmukohta = (
  programItems: readonly KompassiProgramItemSolmukohta[],
): readonly ProgramItem[] => {
  return programItems.map((programItem) => {
    return {
      programItemId: programItem.slug,
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
      tags: [],
      genres: [],
      styles: [],
      languages: [Language.ENGLISH],
      endTime: dayjs(programItem.end_time).toISOString(),
      people: programItem.formatted_hosts,
      minAttendance: programItem.min_players,
      maxAttendance: programItem.max_players,
      gameSystem: programItem.rpg_system,
      shortDescription: programItem.short_blurb,
      revolvingDoor: false,
      programType: mapProgramType(programItem),
      contentWarnings: programItem.ropecon2022_content_warnings,
      otherAuthor: programItem.other_author,
      accessibilityValues: [],
      popularity: 0,
      otherAccessibilityInformation:
        programItem.ropecon2023_other_accessibility_information,
      entryFee: programItem.ropecon2023_workshop_fee,
      signupType: "konsti",
    };
  });
};

const mapProgramType = (
  kompassiProgramItem: KompassiProgramItemSolmukohta,
): ProgramType => {
  const programType = kompassiProgramItem.category_title;

  switch (programType) {
    case KompassiProgramTypeSolmukohta.LARP:
      return ProgramType.LARP;

    case KompassiProgramTypeSolmukohta.WORKSHOP:
      return ProgramType.WORKSHOP;

    case KompassiProgramTypeSolmukohta.ROUNDTABLE_DISCUSSION:
      return ProgramType.ROUNDTABLE_DISCUSSION;

    default:
      return exhaustiveSwitchGuard(programType);
  }
};
