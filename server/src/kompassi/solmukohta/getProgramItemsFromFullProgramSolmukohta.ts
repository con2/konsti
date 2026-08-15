import { first } from "remeda";
import { config } from "shared/config";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";
import {
  KompassiKonstiProgramType,
  KompassiProgramItem,
  KompassiProgramItemSchema,
} from "server/kompassi/kompassiProgramItem";
import { logger } from "server/utils/logger";

export const getProgramItemsFromFullProgramSolmukohta = (
  programItems: unknown[],
): KompassiProgramItem[] => {
  checkUnknownKeys(programItems, KompassiProgramItemSchema);

  const kompassiProgramItems = programItems.flatMap((programItem) => {
    const result = parseProgramItem(programItem, KompassiProgramItemSchema);
    return result ?? [];
  });

  logger.info(`Found ${kompassiProgramItems.length} valid program items`);

  const matchingProgramItems = kompassiProgramItems.flatMap((programItem) => {
    // These program items are hand picked to be exported from Kompassi
    if (config.event().addToKonstiOther.includes(programItem.slug)) {
      return programItem;
    }

    // Take program items with Konsti dimension and valid program type
    const programType = first(programItem.cachedDimensions.konsti);

    const validProgramType =
      programType &&
      Object.values(KompassiKonstiProgramType).includes(programType);

    if (!validProgramType) {
      return [];
    }

    /*
    // Take program items with tag "sk-advance-signup"
    if (!programItem.tags.includes(KompassiTag.ADVANCE_SIGNUP)) {
      return [];
    }
      */

    return programItem;
  });

  if (matchingProgramItems.length === 0) {
    logger.error(new Error("No program items with known categories found"));
    return [];
  }

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  return matchingProgramItems;
};
