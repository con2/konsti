import fs from "fs";
import path from "path";
import { ZodError } from "zod";
import axios from "axios";
import _ from "lodash";
import { logger } from "server/utils/logger";
import { config } from "server/config";
import {
  KompassiGame,
  KompassiGameSchema,
  KompassiProgramType,
  KompassiSignupType,
  experiencePointAndOtherProgramTypes,
  tournamentProgramTypes,
} from "shared/typings/models/kompassiGame";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { KompassiError } from "shared/typings/api/errors";
import { sharedConfig } from "shared/config/sharedConfig";

type EventProgramItem = KompassiGame;

const { useLocalProgramFile, localKompassiFile } = config;

export const getGamesFromKompassi = async (): Promise<
  Result<readonly KompassiGame[], KompassiError>
> => {
  const eventProgramItemsResult =
    await testHelperWrapper.getEventProgramItems();
  if (isErrorResult(eventProgramItemsResult)) {
    return eventProgramItemsResult;
  }

  const eventProgramItems = unwrapResult(eventProgramItemsResult);

  if (!Array.isArray(eventProgramItems)) {
    logger.error(
      "%s",
      new Error("Invalid Kompassi response format, should be array"),
    );
    return makeErrorResult(KompassiError.INVALID_RESPONSE);
  }

  if (eventProgramItems.length === 0) {
    logger.error("%s", new Error("No program items found"));
    return makeErrorResult(KompassiError.NO_PROGRAM_ITEMS);
  }

  logger.info(`Loaded ${eventProgramItems.length} event program items`);

  const games = getGamesFromFullProgram(eventProgramItems);

  return games.length === 0
    ? makeErrorResult(KompassiError.NO_PROGRAM_ITEMS)
    : makeSuccessResult(games);
};

const getEventProgramItems = async (): Promise<
  Result<EventProgramItem[], KompassiError>
> => {
  return useLocalProgramFile
    ? getProgramFromLocalFile()
    : await getProgramFromServer();
};

// This helper wrapper is needed to make Vitest spyOn() work
//  https://github.com/vitest-dev/vitest/issues/1329
export const testHelperWrapper = {
  getEventProgramItems,
};

const getProgramFromLocalFile = (): Result<
  EventProgramItem[],
  KompassiError
> => {
  logger.info("GET event program from local filesystem");

  const rawData = fs.readFileSync(
    path.join(
      __dirname,
      `../../../test/kompassi-data-dumps/${localKompassiFile}`,
    ),
    "utf8",
  );

  return makeSuccessResult(JSON.parse(rawData));
};

const getProgramFromServer = async (): Promise<
  Result<EventProgramItem[], KompassiError>
> => {
  logger.info("GET event program from remote server");

  try {
    const response = await axios.get(config.dataUri);
    return makeSuccessResult(response.data);
  } catch (error) {
    logger.error("Games request error: %s", error);
    return makeErrorResult(KompassiError.UNKNOWN_ERROR);
  }
};

const checkUnknownKeys = (programItems: EventProgramItem[]): void => {
  const unknownKeys: string[] = programItems.flatMap((programItem) => {
    return Object.keys(programItem).filter(
      (key) =>
        !Object.prototype.hasOwnProperty.call(KompassiGameSchema.shape, key),
    );
  });

  if (unknownKeys.length > 0) {
    logger.error(
      "%s",
      new Error(
        `Found unknown keys for program items: ${_.uniq(unknownKeys).join(
          " ",
        )}`,
      ),
    );
  }
};

const parseProgramItem = (
  programItem: EventProgramItem,
): EventProgramItem | undefined => {
  const result = KompassiGameSchema.safeParse(programItem);

  if (result.success) {
    return result.data;
  }

  if (result.error instanceof ZodError) {
    result.error.issues.map((issue) => {
      logger.error(
        "%s",
        new Error(
          `Invalid program item ${programItem.identifier} at path ${issue.path}: ${issue.message}`,
        ),
      );
    });
    return;
  }

  logger.error(
    `Unknown error while parsing game ${programItem.identifier}: %s`,
    result.error,
  );
};

const getGamesFromFullProgram = (
  programItems: EventProgramItem[],
): KompassiGame[] => {
  const matchingProgramItems: EventProgramItem[] = programItems.flatMap(
    (programItem) => {
      // These program items are hand picked to be exported from Kompassi
      if (sharedConfig.addToKonsti.includes(programItem.identifier)) {
        return programItem;
      }

      // Take program items with valid program type
      if (
        !Object.values(KompassiProgramType).includes(programItem.category_title)
      ) {
        return [];
      }

      // Take 'Experience Point' and 'Other' program items where "ropecon2023_signuplist": "konsti"
      if (
        experiencePointAndOtherProgramTypes.includes(
          programItem.category_title,
        ) &&
        programItem.ropecon2023_signuplist !== KompassiSignupType.KONSTI
      ) {
        return [];
      }

      // Take 'Tournament' program items where "ropecon2023_signuplist": "konsti"
      if (
        tournamentProgramTypes.includes(programItem.category_title) &&
        programItem.ropecon2023_signuplist !== KompassiSignupType.KONSTI
      ) {
        return [];
      }

      return programItem;
    },
  );

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  checkUnknownKeys(matchingProgramItems);

  const kompassiGames: KompassiGame[] = matchingProgramItems.flatMap(
    (programItem) => {
      const result = parseProgramItem(programItem);
      return result ?? [];
    },
  );

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
