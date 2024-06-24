import { first } from "lodash-es";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { kompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  KompassiProgramItemRopecon,
  KompassiProgramItemSchemaRopecon,
  KompassiKonstiProgramTypeRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";

export const getProgramItemsFromFullProgramRopecon = (
  programItems: KompassiProgramItemRopecon[],
): kompassiProgramItem[] => {
  const matchingProgramItems = programItems.flatMap((programItem) => {
    // These program items are hand picked to be exported from Kompassi
    if (config.shared().addToKonsti.includes(programItem.slug)) {
      return programItem;
    }

    // Take program items with Konsti dimension and valid program type
    const programType = first(programItem.cachedDimensions.konsti);

    const shouldPickProgramItem =
      programType &&
      Object.values(KompassiKonstiProgramTypeRopecon).includes(programType);

    if (!shouldPickProgramItem) {
      return [];
    }

    return programItem;
  });

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  checkUnknownKeys(matchingProgramItems, KompassiProgramItemSchemaRopecon);

  const kompassiProgramItems = matchingProgramItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaRopecon,
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
