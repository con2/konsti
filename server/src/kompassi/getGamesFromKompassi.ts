import fs from "fs";
import path from "path";
import axios from "axios";
import { ZodError } from "zod";
import { uniq } from "lodash-es";
import { KompassiError } from "shared/types/api/errors";
import { KompassiGame, KompassiGameSchema } from "server/kompassi/kompassiGame";
import {
  Result,
  isErrorResult,
  makeErrorResult,
  makeSuccessResult,
  unwrapResult,
} from "shared/utils/result";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ConventionName } from "shared/config/sharedConfigTypes";
import { getGamesFromFullProgram } from "server/kompassi/getGamesFromFullProgram";

export const getGamesFromKompassi = async (
  conventionName: ConventionName,
): Promise<Result<KompassiGame[], KompassiError>> => {
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

  const games = getGamesFromFullProgram(conventionName, eventProgramItems);

  return games.length === 0
    ? makeErrorResult(KompassiError.NO_PROGRAM_ITEMS)
    : makeSuccessResult(games);
};

export const parseProgramItem = (
  programItem: KompassiGame,
  schema: KompassiGameSchema,
): KompassiGame | undefined => {
  const result = schema.safeParse(programItem);

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

const getEventProgramItems = async (): Promise<
  Result<KompassiGame[], KompassiError>
> => {
  const { useLocalProgramFile } = config.server();

  return useLocalProgramFile
    ? getProgramFromLocalFile()
    : await getProgramFromServer();
};

// This helper wrapper is needed to make Vitest spyOn() work
//  https://github.com/vitest-dev/vitest/issues/1329
export const testHelperWrapper = {
  getEventProgramItems,
};

const getProgramFromLocalFile = (): Result<KompassiGame[], KompassiError> => {
  logger.info("GET event program from local filesystem");

  const { localKompassiFile } = config.server();

  const rawData = fs.readFileSync(
    path.join(__dirname, `../test/kompassi-data-dumps/${localKompassiFile}`),
    "utf8",
  );

  return makeSuccessResult(JSON.parse(rawData));
};

const getProgramFromServer = async (): Promise<
  Result<KompassiGame[], KompassiError>
> => {
  logger.info("GET event program from remote server");

  try {
    const response = await axios.get(config.server().dataUri);
    return makeSuccessResult(response.data);
  } catch (error) {
    logger.error("Games request error: %s", error);
    return makeErrorResult(KompassiError.UNKNOWN_ERROR);
  }
};

export const checkUnknownKeys = (
  programItems: KompassiGame[],
  schema: KompassiGameSchema,
): void => {
  const unknownKeys: string[] = programItems.flatMap((programItem) => {
    return Object.keys(programItem).filter(
      (key) => !Object.prototype.hasOwnProperty.call(schema.shape, key),
    );
  });

  if (unknownKeys.length > 0) {
    logger.error(
      "%s",
      new Error(
        `Found unknown keys for program items: ${uniq(unknownKeys).join(" ")}`,
      ),
    );
  }
};
