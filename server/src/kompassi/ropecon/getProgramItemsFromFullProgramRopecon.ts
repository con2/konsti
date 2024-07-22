import dayjs from "dayjs";
import { first } from "lodash-es";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { KompassiProgramItem } from "server/kompassi/kompassiProgramItem";
import {
  KompassiProgramItemSchemaRopecon,
  KompassiKonstiProgramTypeRopecon,
  KompassiProgramItemRopecon,
} from "server/kompassi/ropecon/kompassiProgramItemRopecon";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getProgramItemsFromFullProgramRopecon = (
  programItems: unknown[],
): KompassiProgramItem[] => {
  checkUnknownKeys(programItems, KompassiProgramItemSchemaRopecon);

  const kompassiProgramItems = programItems.flatMap((programItem) => {
    const result = parseProgramItem(
      programItem,
      KompassiProgramItemSchemaRopecon,
    );
    return result ?? [];
  }) as KompassiProgramItemRopecon[];

  logger.info(`Found ${kompassiProgramItems.length} valid program items`);

  const matchingProgramItems = kompassiProgramItems.flatMap((programItem) => {
    // Hand picked program items with invalid program type - use 'other' program type
    if (config.shared().addToKonstiOther.includes(programItem.slug)) {
      return {
        ...programItem,
        cachedDimensions: {
          ...programItem.cachedDimensions,
          konsti: [KompassiKonstiProgramTypeRopecon.OTHER],
        },
      };
    }

    // Take program items with Konsti dimension and valid program type
    const programType = first(programItem.cachedDimensions.konsti);

    const validProgramType =
      programType &&
      Object.values(KompassiKonstiProgramTypeRopecon).includes(programType);

    if (!validProgramType) {
      return [];
    }

    if (config.shared().logInvalidStartTimes) {
      const startTime = programItem.scheduleItems[0].startTime;
      const startMinute = dayjs(startTime).minute();
      if (
        programType === KompassiKonstiProgramTypeRopecon.TABLETOP_RPG &&
        startMinute !== 0
      ) {
        logger.error(
          "s",
          new Error(
            // eslint-disable-next-line no-restricted-syntax
            `Invalid RPG start time: ${dayjs(startTime).tz(TIMEZONE).format("HH:mm")} - ${programItem.title}`,
          ),
        );
      }
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
