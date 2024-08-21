import { first } from "lodash-es";
import { logger } from "server/utils/logger";
import {
  KompassiProgramItem,
  KompassiProgramItemSchema,
  KompassiKonstiProgramType,
} from "server/kompassi/kompassiProgramItem";
import { config } from "shared/config";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";

export const getProgramItemsFromFullProgramHitpoint = (
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
