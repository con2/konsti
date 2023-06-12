import fs from "fs";
import path from "path";
import { ZodError } from "zod";
import axios from "axios";
import { logger } from "server/utils/logger";
import { config } from "server/config";
import {
  KompassiGame,
  KompassiGameSchema,
  KompassiGameStyle,
  KompassiGenre,
  KompassiProgramType,
  KompassiTag,
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

type EventProgramItem = KompassiGame;

export const TOURNAMENT_EVENT_TYPE = "tmnt";

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
    logger.error("%s", new Error("Invalid response format, should be array"));
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
      `../../../test/kompassi-data-dumps/${localKompassiFile}`
    ),
    "utf8"
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

const getGamesFromFullProgram = (
  programItems: EventProgramItem[]
): KompassiGame[] => {
  const matchingProgramItems: EventProgramItem[] = programItems.flatMap(
    (programItem) => {
      // Take program items with valid program type
      if (
        !Object.values(KompassiProgramType).includes(programItem.category_title)
      ) {
        return [];
      }

      // Tournaments have multple different program types
      // Take events with type_of_game_program: TOURNAMENT_EVENT_TYPE
      if (
        tournamentProgramTypes.includes(programItem.category_title) &&
        programItem.type_of_game_program !== TOURNAMENT_EVENT_TYPE
      ) {
        return [];
      }

      return programItem;
    }
  );

  logger.info(`Found ${matchingProgramItems.length} matching program items`);

  const kompassiGames: KompassiGame[] = matchingProgramItems.flatMap(
    (programItem) => {
      try {
        return KompassiGameSchema.parse(programItem);
      } catch (error) {
        if (error instanceof ZodError) {
          error.issues.map((issue) => {
            if (issue.code === "invalid_enum_value") {
              const key = issue.path[0] as keyof KompassiGame;
              const index = issue.path[1] as number;

              const invalidValue = getInvalidValueFromEnumError(
                programItem,
                key,
                index
              );

              logger.error(
                "%s",
                new Error(
                  `Invalid ${key} found for game ${programItem.identifier}: ${invalidValue}`
                )
              );
            } else {
              logger.error(
                "%s",
                new Error(
                  `Error parsing program item ${programItem.identifier}: ${issue.message}`
                )
              );
            }
          });
        } else {
          logger.error(
            `Unknown error while parsing game ${programItem.identifier}: %s`,
            error
          );
        }

        return [];
      }
    }
  );

  if (kompassiGames.length === 0) {
    logger.error(
      "%s",
      new Error("No program items with known categories found")
    );
    return [];
  }

  logger.info(`Found ${kompassiGames.length} valid games`);

  return kompassiGames;
};

const getInvalidValueFromEnumError = (
  programItem: KompassiGame,
  key: keyof KompassiGame,
  index: number
): KompassiTag | KompassiGenre | KompassiGameStyle | string => {
  switch (key) {
    case "tags":
      return programItem[key][index];
    case "genres":
      return programItem[key][index];
    case "styles":
      return programItem[key][index];
    default:
      return "unknown enum value";
  }
};
