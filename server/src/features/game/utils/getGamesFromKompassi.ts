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

type EventProgramItem = KompassiGame;

export const TOURNAMENT_EVENT_TYPE = "tmnt";

const { useLocalProgramFile, localKompassiFile } = config;

export const getGamesFromKompassi = async (): Promise<
  readonly KompassiGame[]
> => {
  const eventProgramItems = await testHelperWrapper.getEventProgramItems();

  if (!Array.isArray(eventProgramItems)) {
    throw new Error("Invalid response format, should be array");
  }

  if (eventProgramItems.length === 0) {
    throw new Error("No program items found");
  }

  logger.info(`Loaded ${eventProgramItems.length} event program items`);

  return getGamesFromFullProgram(eventProgramItems);
};

const getEventProgramItems = async (): Promise<EventProgramItem[]> => {
  return useLocalProgramFile
    ? getProgramFromLocalFile()
    : await getProgramFromServer();
};

// This helper wrapper is needed to make Vitest spyOn() work
//  https://github.com/vitest-dev/vitest/issues/1329
export const testHelperWrapper = {
  getEventProgramItems,
};

const getProgramFromLocalFile = (): EventProgramItem[] => {
  logger.info("GET event program from local filesystem");

  const rawData = fs.readFileSync(
    path.join(
      __dirname,
      `../../../test/kompassi-data-dumps/${localKompassiFile}`
    ),
    "utf8"
  );

  return JSON.parse(rawData);
};

const getProgramFromServer = async (): Promise<EventProgramItem[]> => {
  logger.info("GET event program from remote server");

  try {
    const response = await axios.get(config.dataUri);
    return response.data;
  } catch (error) {
    logger.error(`Games request error: ${error}`);
    throw error;
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
                `Invalid ${key} found for game ${programItem.identifier}: ${invalidValue}`
              );
            } else {
              logger.error(
                `Error parsing program item ${programItem.identifier}: ${issue.message}`
              );
            }
          });
        } else {
          logger.error(
            `Unknown error while parsing game ${programItem.identifier}`
          );
        }

        return [];
      }
    }
  );

  if (kompassiGames.length === 0) {
    throw new Error(
      `No program items with following categories found: ${Object.values(
        KompassiProgramType
      ).join(", ")}`
    );
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
