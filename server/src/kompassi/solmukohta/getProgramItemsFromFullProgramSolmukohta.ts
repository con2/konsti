import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { kompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  KompassiProgramItemSolmukohta,
  KompassiProgramItemSchemaSolmukohta,
  KompassiProgramTypeSolmukohta,
  KompassiTagSolmukohta,
} from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";

export const getProgramItemsFromFullProgramSolmukohta = (
  programItems: KompassiProgramItemSolmukohta[],
): kompassiProgramItem[] => {
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

  checkUnknownKeys(matchingProgramItems, KompassiProgramItemSchemaSolmukohta);

  const kompassiProgramItems = matchingProgramItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaSolmukohta,
    );
    return result ?? [];
  });

  if (kompassiProgramItems.length === 0) {
    logger.error(
      "%s",
      new Error("No program items with known categories found"),
    );
    return [];
  }

  logger.info(`Found ${kompassiProgramItems.length} valid program items`);

  return kompassiProgramItems;
};
