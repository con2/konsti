import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getGamesFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { KompassiGame } from "server/kompassi/kompassiGame";
import {
  KompassiGameSolmukohta,
  KompassiGameSchemaSolmukohta,
  KompassiProgramTypeSolmukohta,
  KompassiTagSolmukohta,
} from "server/kompassi/solmukohta/kompassiGameSolmukohta";

export const getGamesFromFullProgramSolmukohta = (
  programItems: KompassiGameSolmukohta[],
): KompassiGame[] => {
  const matchingProgramItems = programItems.flatMap((programItem) => {
    // These program items are hand picked to be exported from Kompassi
    if (config.shared().addToKonsti.includes(programItem.identifier)) {
      return programItem;
    }

    // Take program items with valid program type
    if (
      !Object.values(KompassiProgramTypeSolmukohta).includes(
        programItem.category_title,
      )
    ) {
      return [];
    }

    // Take program items with tag "sk-advance-signup"
    if (!programItem.tags.includes(KompassiTagSolmukohta.ADVANCE_SIGNUP)) {
      return [];
    }

    return programItem;
  });

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  checkUnknownKeys(matchingProgramItems, KompassiGameSchemaSolmukohta);

  const kompassiGames = matchingProgramItems.flatMap((programItem) => {
    const result = parseProgramItem(programItem, KompassiGameSchemaSolmukohta);
    return result ?? [];
  });

  if (kompassiGames.length === 0) {
    logger.error(
      "%s",
      new Error("No program items with known categories found"),
    );
    return [];
  }

  logger.info(`Found ${kompassiGames.length} valid games`);

  return kompassiGames;
};
