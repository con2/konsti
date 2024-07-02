import fs from "fs";
import path from "path";
import axios from "axios";
import { z, ZodError } from "zod";
import { uniq } from "lodash-es";
import { KompassiError } from "shared/types/api/errors";
import {
  KompassiProgramItem,
  KompassiProgramItemSchema,
} from "server/kompassi/kompassiProgramItem";
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
import { getProgramItemsFromFullProgram } from "server/kompassi/getProgramItemsFromFullProgram";

export const getProgramItemsFromKompassi = async (
  conventionName: ConventionName,
): Promise<Result<KompassiProgramItem[], KompassiError>> => {
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

  const programItems = getProgramItemsFromFullProgram(
    conventionName,
    eventProgramItems,
  );

  return programItems.length === 0
    ? makeErrorResult(KompassiError.NO_PROGRAM_ITEMS)
    : makeSuccessResult(programItems);
};

const getProgramItemId = (programItem: unknown) => {
  return !!programItem &&
    typeof programItem === "object" &&
    "slug" in programItem
    ? programItem.slug
    : "<unknown>";
};

export const parseProgramItem = (
  programItem: unknown,
  schema: KompassiProgramItemSchema,
): KompassiProgramItem | undefined => {
  const result = schema.safeParse(programItem);

  if (result.success) {
    return result.data;
  }

  if (result.error instanceof ZodError) {
    result.error.issues.map((issue) => {
      logger.error(
        "%s",
        new Error(
          `Invalid program item ${getProgramItemId(programItem)} at path ${issue.path}: ${issue.message}`,
        ),
      );
    });
    return;
  }

  logger.error(
    `Unknown error while parsing program item ${getProgramItemId(programItem)}: %s`,
    result.error,
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
    path.join(__dirname, `../test/kompassi-data-dumps/${localKompassiFile}`),
    "utf8",
  );

  return makeSuccessResult(JSON.parse(rawData));
};

const KompassiResponseFormSchema = z.object({
  data: z.object({
    event: z.object({ program: z.object({ programs: z.array(z.unknown()) }) }),
  }),
});

const getProgramFromServer = async (): Promise<
  Result<unknown, KompassiError>
> => {
  logger.info("GET event program from remote server");

  const url = "https://kompassi.eu/graphql";
  const body = {
    query: `
      query ProgramListQuery($event: String!) {
          event(slug: $event) {
              program {
                  programs(hidePast: false) {
                      slug
                      title
                      description
                      cachedHosts
                      cachedDimensions
                      cachedAnnotations
                      scheduleItems {
                          startTime
                          endTime
                          lengthMinutes
                          location
                      }
                  }
              }
          }
      }
    `,
    variables: {
      event: "ropecon2024",
    },
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post<unknown>(url, body, { headers });
    const result = KompassiResponseFormSchema.safeParse(response.data);
    if (!result.success) {
      logger.error(
        "Error downloading program items from Kompassi: %s",
        new Error("Invalid return value format"),
      );
      return makeErrorResult(KompassiError.UNKNOWN_ERROR);
    }
    const programItems = result.data.data.event.program.programs;
    return makeSuccessResult(programItems);
  } catch (error) {
    logger.error("Error downloading program items from Kompassi: %s", error);
    return makeErrorResult(KompassiError.UNKNOWN_ERROR);
  }
};

// TODO: Only checks top level object keys, not nested object keys
export const checkUnknownKeys = (
  programItems: unknown[],
  schema: KompassiProgramItemSchema,
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
      "%s",
      new Error(
        `Found unknown keys for program items: ${uniq(unknownKeys).join(" ")}`,
      ),
    );
  }
};
