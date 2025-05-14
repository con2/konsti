import dayjs from "dayjs";
import { first } from "remeda";
import {
  checkUnknownKeys,
  parseProgramItem,
} from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import {
  KompassiKonstiProgramType,
  KompassiProgramItemSchema,
  KompassiProgramItem,
} from "server/kompassi/kompassiProgramItem";
import { TIMEZONE } from "shared/utils/initializeDayjs";

export const getProgramItemsFromFullProgramRopecon = (
  programItems: unknown[],
): KompassiProgramItem[] => {
  checkUnknownKeys(programItems, KompassiProgramItemSchema);

  const kompassiProgramItems = programItems.flatMap((programItem) => {
    const result = parseProgramItem(programItem, KompassiProgramItemSchema);
    return result ?? [];
  });

  logger.info(`Found ${kompassiProgramItems.length} valid program items`);

  const matchingProgramItems = kompassiProgramItems.flatMap((programItem) => {
    // Hand picked program items with invalid program type - use 'other' program type
    if (config.event().addToKonstiOther.includes(programItem.slug)) {
      return {
        ...programItem,
        cachedDimensions: {
          ...programItem.cachedDimensions,
          konsti: [KompassiKonstiProgramType.OTHER],
        },
      };
    }

    // Take program items with Konsti dimension and valid program type
    const programType = first(programItem.cachedDimensions.konsti);

    const validProgramType =
      programType &&
      Object.values(KompassiKonstiProgramType).includes(programType);

    if (!validProgramType) {
      return [];
    }

    if (config.event().logInvalidStartTimes) {
      const startTime = programItem.scheduleItems[0].startTime;
      const startMinute = dayjs(startTime).minute();
      if (
        programType === KompassiKonstiProgramType.TABLETOP_RPG &&
        startMinute !== 0
      ) {
        logger.error(
          "%s",
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
