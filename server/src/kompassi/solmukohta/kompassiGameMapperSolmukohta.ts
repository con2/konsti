import dayjs from "dayjs";
import {
  ProgramItem,
  Language,
  ProgramType,
} from "shared/types/models/programItem";
import {
  KompassiGameSolmukohta,
  KompassiProgramTypeSolmukohta,
} from "server/kompassi/solmukohta/kompassiGameSolmukohta";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";

export const kompassiGameMapperSolmukohta = (
  games: readonly KompassiGameSolmukohta[],
): readonly ProgramItem[] => {
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
      tags: [],
      genres: [],
      styles: [],
      language: Language.ENGLISH,
      endTime: dayjs(game.end_time).toISOString(),
      people: game.formatted_hosts,
      minAttendance: game.min_players,
      maxAttendance: game.max_players,
      gameSystem: game.rpg_system,
      shortDescription: game.short_blurb,
      revolvingDoor: false,
      programType: mapProgramType(game),
      contentWarnings: game.ropecon2022_content_warnings,
      otherAuthor: game.other_author,
      accessibilityValues: [],
      popularity: 0,
      otherAccessibilityInformation:
        game.ropecon2023_other_accessibility_information,
      entryFee: game.ropecon2023_workshop_fee,
      signupType: "konsti",
    };
  });
};

const mapProgramType = (kompassiGame: KompassiGameSolmukohta): ProgramType => {
  const programType = kompassiGame.category_title;

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
