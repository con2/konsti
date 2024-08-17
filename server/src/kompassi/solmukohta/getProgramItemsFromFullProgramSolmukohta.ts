import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  KompassiProgramItemSchemaSolmukohta,
  KompassiProgramItemSolmukohta,
  KompassiProgramTypeSolmukohta,
  KompassiTagSolmukohta,
} from "server/kompassi/solmukohta/kompassiProgramItemSolmukohta";

export const getProgramItemsFromFullProgramSolmukohta = (
  programItems: unknown[],
): KompassiProgramItem[] => {
  checkUnknownKeys(programItems, KompassiProgramItemSchemaSolmukohta);

  const kompassiProgramItems = programItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaSolmukohta,
    );
    return result ?? [];
  }) as KompassiProgramItemSolmukohta[];

  logger.info(`Found ${kompassiProgramItems.length} valid program items`);

  const matchingProgramItems = kompassiProgramItems.flatMap((programItem) => {
    // These program items are hand picked to be exported from Kompassi
    if (config.event().addToKonstiOther.includes(programItem.slug)) {
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

  if (matchingProgramItems.length === 0) {
    logger.error(
      "%s",
      new Error("No program items with known categories found"),
    );
    return [];
  }

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  return matchingProgramItems;
};
