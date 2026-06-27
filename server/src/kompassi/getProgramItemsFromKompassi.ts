import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import { z, ZodError } from "zod";
import { first, unique } from "remeda";
import { KompassiError } from "shared/types/api/errors";
import {
  KompassiKonstiProgramType,
  KompassiProgramItem,
  KompassiProgramItemSchema,
  KompassiRegistration,
} from "server/kompassi/kompassiProgramItem";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { EventName } from "shared/config/eventConfigTypes";
import { getProgramItemsFromFullProgram } from "server/kompassi/getProgramItemsFromFullProgram";
import { exhaustiveSwitchGuard } from "shared/utils/exhaustiveSwitchGuard";
import { getTime } from "shared/utils/timeFormatter";
import { ProgramType } from "shared/types/models/programItem";

export const getProgramItemsFromKompassi = async (
  eventName: EventName,
): Promise<Result<KompassiProgramItem[], KompassiError>> => {
  const eventProgramItemsResult =
    await testHelperWrapper.getEventProgramItems();
  if (!eventProgramItemsResult.ok) {
    return eventProgramItemsResult;
  }

  const eventProgramItems = eventProgramItemsResult.value;

  if (!Array.isArray(eventProgramItems)) {
    logger.error(
      new Error("Invalid Kompassi response format, should be array"),
    );
    return makeErrorResult(KompassiError.INVALID_RESPONSE);
  }

  if (eventProgramItems.length === 0) {
    logger.error(new Error("No program items found"));
    return makeErrorResult(KompassiError.NO_PROGRAM_ITEMS);
  }

  logger.info(`Loaded ${eventProgramItems.length} event program items`);

  const programItems = getProgramItemsFromFullProgram(
    eventName,
    eventProgramItems,
  );

  return programItems.length === 0
    ? makeErrorResult(KompassiError.NO_PROGRAM_ITEMS)
    : makeSuccessResult(programItems);
};

const getProgramItemId = (programItem: unknown): unknown => {
  return !!programItem &&
    typeof programItem === "object" &&
    "slug" in programItem
    ? programItem.slug
    : "<unknown>";
};

const getProgramItemIsCancelled = (programItem: unknown): unknown => {
  return !!programItem &&
    typeof programItem === "object" &&
    "isCancelled" in programItem
    ? programItem.isCancelled
    : "<unknown>";
};

export const parseProgramItem = (
  programItem: unknown,
  schema: typeof KompassiProgramItemSchema,
): KompassiProgramItem | undefined => {
  if (
    config
      .event()
      .ignoreProgramItemsIds.includes(getProgramItemId(programItem) as string)
  ) {
    return;
  }

  const result = schema.safeParse(programItem);

  if (result.success) {
    return result.data;
  }

  if (result.error instanceof ZodError) {
    result.error.issues.map((issue) => {
      // Don't log missing scheduleItems error if program item is cancelled
      if (String(issue.path) === "scheduleItems") {
        const isCancelled = getProgramItemIsCancelled(programItem);
        if (isCancelled) {
          return;
        }
      }
      logger.error(
        new Error(
          `Invalid program item ${String(getProgramItemId(programItem))} at path ${issue.path.join(".")}: ${issue.message}`,
        ),
      );
    });
    return;
  }

  logger.error(
    new Error(
      `Unknown error while parsing program item ${String(getProgramItemId(programItem))}`,
      { cause: result.error },
    ),
  );
};

const getEventProgramItems = async (): Promise<
  Result<unknown, KompassiError>
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

const getProgramFromLocalFile = (): Result<unknown, KompassiError> => {
  logger.info("GET event program from local filesystem");

  const { localKompassiFile } = config.server();

  const rawData = fs.readFileSync(
    path.join(
      import.meta.dirname,
      `../test/kompassi-data-dumps/${localKompassiFile}`,
    ),
    "utf8",
  );

  return makeSuccessResult(JSON.parse(rawData));
};

const KompassiResponseFormSchema = z.object({
  data: z.object({
    event: z.object({ program: z.object({ programs: z.array(z.unknown()) }) }),
  }),
});

const eventNameToKompassiEventName = (eventName: EventName): string => {
  switch (eventName) {
    case EventName.ROPECON:
      return "ropecon";
    case EventName.HITPOINT:
      return "hitpoint";
    case EventName.SOLMUKOHTA:
      return "solmukohta";
    case EventName.TRACON:
      return "tracon";
    default:
      return exhaustiveSwitchGuard(eventName);
  }
};

export const getProgramFromServer = async (): Promise<
  Result<unknown, KompassiError>
> => {
  logger.info("GET event program from remote server");

  const { eventName, eventYear, activeProgramTypes } = config.event();

  const url = "https://kompassi.eu/graphql";
  const body = {
    query: `
      query ProgramListQuery($event: String!, $programTypes: [String!]! ) {
          event(slug: $event) {
              program {
                  programs(hidePast: false, filters: [{ dimension: "konsti", values: $programTypes }]) {
                      slug
                      title
                      description
                      cachedHosts
                      cachedDimensions
                      cachedAnnotations
                      isCancelled
                      scheduleItems {
                          slug
                          title
                          startTime
                          endTime
                          lengthMinutes
                          location
                          isCancelled
                          cachedAnnotations
                      }
                  }
              }
          }
      }
    `,
    variables: {
      event: `${eventNameToKompassiEventName(eventName)}${eventYear}`,
      programTypes:
        mapKonstiProgramTypesToKompassiProgramTypes(activeProgramTypes),
    },
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const responseData = await response.json();
    const result = KompassiResponseFormSchema.safeParse(responseData);
    if (!result.success) {
      logger.error(
        new Error(
          "Error downloading program items from Kompassi: Invalid return value format",
        ),
      );
      return makeErrorResult(KompassiError.UNKNOWN_ERROR);
    }
    const programItems = result.data.data.event.program.programs;
    return makeSuccessResult(programItems);
  } catch (error) {
    logger.error(
      new Error("Error downloading program items from Kompassi", {
        cause: error,
      }),
    );
    return makeErrorResult(KompassiError.UNKNOWN_ERROR);
  }
};

// TODO: Only checks top level object keys, not nested object keys
export const checkUnknownKeys = (
  programItems: unknown[],
  schema: typeof KompassiProgramItemSchema,
): void => {
  const unknownKeys: string[] = programItems.flatMap((programItem) => {
    if (!programItem || typeof programItem !== "object") {
      return [];
    }

    return Object.keys(programItem).filter(
      (key) => !Object.prototype.hasOwnProperty.call(schema.shape, key),
    );
  });

  if (unknownKeys.length > 0) {
    logger.error(
      new Error(
        `Found unknown keys for program items: ${unique(unknownKeys).join(" ")}`,
      ),
    );
  }
};

export const logInvalidStartTimes = (
  programItem: KompassiProgramItem,
  programType: KompassiKonstiProgramType,
): void => {
  const evenHourProgramTypes = mapKonstiProgramTypesToKompassiProgramTypes(
    config.event().twoPhaseSignupProgramTypes,
  );
  const usesKonstiRegisration =
    first(programItem.cachedDimensions.registration) ===
    KompassiRegistration.KONSTI;

  if (!evenHourProgramTypes.includes(programType) || !usesKonstiRegisration) {
    return;
  }

  programItem.scheduleItems.map((scheduleItem) => {
    const startMinute = dayjs(scheduleItem.startTime).minute();
    if (startMinute !== 0) {
      logger.error(
        new Error(
          `Invalid start time: ${getTime(scheduleItem.startTime)} - ${scheduleItem.slug}`,
        ),
      );
    }
  });
};

export const mapKonstiProgramTypesToKompassiProgramTypes = (
  programTypes: ProgramType[],
): KompassiKonstiProgramType[] => {
  return programTypes.map((programType) => {
    switch (programType) {
      case ProgramType.TABLETOP_RPG:
        return KompassiKonstiProgramType.TABLETOP_RPG;

      case ProgramType.LARP:
        return KompassiKonstiProgramType.LARP;

      case ProgramType.TOURNAMENT:
        return KompassiKonstiProgramType.TOURNAMENT;

      case ProgramType.WORKSHOP:
        return KompassiKonstiProgramType.WORKSHOP;

      case ProgramType.EXPERIENCE_POINT:
        return KompassiKonstiProgramType.EXPERIENCE_POINT;

      case ProgramType.OTHER:
        return KompassiKonstiProgramType.OTHER;

      case ProgramType.FLEAMARKET:
        return KompassiKonstiProgramType.FLEAMARKET;

      case ProgramType.ROUNDTABLE_DISCUSSION:
        return KompassiKonstiProgramType.ROUNDTABLE_DISCUSSION;

      case ProgramType.OTHER_GAMING:
        return KompassiKonstiProgramType.OTHER_GAMING;

      default:
        return exhaustiveSwitchGuard(programType);
    }
  });
};
