import { logger } from "server/utils/logger";
import {
  KompassiProgramItemHitpoint,
  KompassiProgramItemSchemaHitpoint,
  KompassiProgramTypeHitpoint,
} from "server/kompassi/hitpoint/kompassiProgramItemHitpoint";
import { config } from "shared/config";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";

export const getProgramItemsFromFullProgramHitpoint = (
  programItems: unknown[],
): KompassiProgramItem[] => {
  checkUnknownKeys(programItems, KompassiProgramItemSchemaHitpoint);

  const kompassiProgramItems = programItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaHitpoint,
    );
    return result ?? [];
  }) as KompassiProgramItemHitpoint[];

  logger.info(`Found ${kompassiProgramItems.length} valid program items`);

  const matchingProgramItems = kompassiProgramItems.flatMap((programItem) => {
    // These program items are hand picked to be exported from Kompassi
    if (config.event().addToKonstiOther.includes(programItem.slug)) {
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
