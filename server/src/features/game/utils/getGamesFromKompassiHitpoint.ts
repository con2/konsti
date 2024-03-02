import { logger } from "server/utils/logger";
import {
  KompassiGameHitpoint,
  KompassiGameSchemaHitpoint,
  KompassiProgramTypeHitpoint,
} from "shared/types/models/kompassiGame/kompassiGameHitpoint";
import { sharedConfig } from "shared/config/sharedConfig";
import { KompassiGame } from "shared/types/models/kompassiGame/kompassiGame";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/features/game/utils/getGamesFromKompassi";

export const getGamesFromFullProgramHitpoint = (
  programItems: KompassiGameHitpoint[],
): KompassiGame[] => {
  const matchingProgramItems: KompassiGameHitpoint[] = programItems.flatMap(
    (programItem) => {
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
    },
  );

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  checkUnknownKeys(matchingProgramItems, KompassiGameSchemaHitpoint);

  const kompassiGames = matchingProgramItems.flatMap((programItem) => {
    const result = parseProgramItem(programItem, KompassiGameSchemaHitpoint);
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
