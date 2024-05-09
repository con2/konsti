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
  KompassiProgramTypeRopecon,
  KompassiSignupTypeRopecon,
  experiencePointAndOtherProgramTypesRopecon,
  tournamentProgramTypesRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";

export const getProgramItemsFromFullProgramRopecon = (
  programItems: KompassiProgramItemRopecon[],
): kompassiProgramItem[] => {
  const matchingProgramItems = programItems.flatMap((programItem) => {
    // These program items are hand picked to be exported from Kompassi
    if (config.shared().addToKonsti.includes(programItem.identifier)) {
      return programItem;
    }

    // Take program items with valid program type
    if (
      !Object.values(KompassiProgramTypeRopecon).includes(
        programItem.category_title,
      )
    ) {
      return [];
    }

    // Take 'Experience Point' and 'Other' program items where "ropecon2023_signuplist": "konsti"
    if (
      experiencePointAndOtherProgramTypesRopecon.includes(
        programItem.category_title,
      ) &&
      programItem.ropecon2023_signuplist !== KompassiSignupTypeRopecon.KONSTI
    ) {
      return [];
    }

    // Take 'Tournament' program items where "ropecon2023_signuplist": "konsti"
    if (
      tournamentProgramTypesRopecon.includes(programItem.category_title) &&
      programItem.ropecon2023_signuplist !== KompassiSignupTypeRopecon.KONSTI
    ) {
      return [];
    }

    return programItem;
  });

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  checkUnknownKeys(matchingProgramItems, KompassiProgramItemSchemaRopecon);

  const kompassiGames = matchingProgramItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaRopecon,
    );
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
