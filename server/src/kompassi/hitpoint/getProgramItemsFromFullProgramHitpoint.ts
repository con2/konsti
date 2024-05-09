import { logger } from "server/utils/logger";
import {
  kompassiProgramItemHitpoint,
  KompassiProgramItemSchemaHitpoint,
  KompassiProgramTypeHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import { sharedConfig } from "shared/config/sharedConfig";
import { kompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";

export const getProgramItemsFromFullProgramHitpoint = (
  programItems: kompassiProgramItemHitpoint[],
): kompassiProgramItem[] => {
  const matchingProgramItems: kompassiProgramItemHitpoint[] =
    programItems.flatMap((programItem) => {
      // These program items are hand picked to be exported from Kompassi
      if (sharedConfig.addToKonsti.includes(programItem.identifier)) {
        return programItem;
      }

      // Take program items with valid program type
      if (
        !Object.values(KompassiProgramTypeHitpoint).includes(
          programItem.category_title,
        )
      ) {
        return [];
      }

      return programItem;
    });

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  checkUnknownKeys(matchingProgramItems, KompassiProgramItemSchemaHitpoint);

  const kompassiProgramItems = matchingProgramItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaHitpoint,
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
