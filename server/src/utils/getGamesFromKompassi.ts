import fs from "fs";
import path from "path";
import { ZodError } from "zod";
import request from "request-promise-native";
import { logger } from "server/utils/logger";
import { config } from "server/config";
import {
  KompassiGame,
  KompassiGameSchema,
  KompassiGameStyle,
  KompassiGenre,
  KompassiProgramType,
  KompassiTag,
} from "shared/typings/models/kompassiGame";

type EventProgramItem = KompassiGame;

export const getGamesFromKompassi = async (): Promise<
  readonly KompassiGame[]
> => {
  const eventProgramItems = config.useLocalProgramFile
    ? getProgramFromLocalFile()
    : await getProgramFromServer();

  if (eventProgramItems?.length === 0) {
    logger.info("No program items found");
    return [];
  }

  logger.info(`Loaded ${eventProgramItems.length} event program items`);

  return getGamesFromProgram(eventProgramItems);
};

const getProgramFromLocalFile = (): EventProgramItem[] => {
  logger.info("GET event program from local filesystem");

  const rawData = fs.readFileSync(
    path.join(
      __dirname,
      "../test/kompassi-data-dumps/program-ropecon-2019.json"
    ),
    "utf8"
  );

  return JSON.parse(rawData);
};

const getProgramFromServer = async (): Promise<EventProgramItem[]> => {
  logger.info("GET event program from remote server");

  const options = {
    uri: config.dataUri,
    headers: {
      "User-Agent": "Request-Promise",
    },
    json: true,
  };

  try {
    return await request(options);
  } catch (error) {
    logger.error(`Games request error: ${error}`);
    throw error;
  }
};

const getGamesFromProgram = (
  programItems: EventProgramItem[]
): KompassiGame[] => {
  const matchingProgramItems: EventProgramItem[] = programItems.filter(
    (programItem) =>
      Object.values(KompassiProgramType).includes(programItem.category_title)
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
    logger.info(
      `No program items with following categories found: ${Object.values(
        KompassiProgramType
      ).join(", ")}`
    );
    return [];
  }

  logger.info(`Found ${kompassiGames.length} games`);

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
