import { z } from "zod";
import { sortBy } from "remeda";
import { eventNameToKompassiEventName } from "server/kompassi/getProgramItemsFromKompassi";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { KompassiError } from "shared/types/api/errors";
import {
  Result,
  makeErrorResult,
  makeSuccessResult,
} from "shared/utils/result";

// Minimal schema for the raw full-program response: the full program item
// schema uses catch() defaults which would fabricate annotation values on
// items that don't have them
const ProgramItemSchema = z.object({
  title: z.string().catch(""),
  isCancelled: z.boolean().catch(false),
  cachedDimensions: z.object({
    form: z.array(z.string()).catch([]),
    konsti: z.array(z.string()).catch([]),
    registration: z.array(z.string()).catch([]),
    type: z.array(z.string()).catch([]),
  }),
  cachedAnnotations: z.object({
    "konsti:minAttendance": z.number().optional(),
    "konsti:maxAttendance": z.number().optional(),
  }),
});

const KompassiResponseSchema = z.object({
  data: z.object({
    event: z.object({ program: z.object({ programs: z.array(z.unknown()) }) }),
  }),
});

// The production fetch only returns program items that already have the Konsti
// program type, so this script needs its own unfiltered full-program query
const getFullProgramFromServer = async (): Promise<
  Result<unknown[], KompassiError>
> => {
  logger.info("GET full event program from remote server");

  const { eventName, eventYear } = config.event();

  const url = "https://kompassi.eu/graphql";
  const body = {
    query: `
      query ProgramListQuery($event: String!) {
          event(slug: $event) {
              program {
                  programs(hidePast: false) {
                      title
                      cachedDimensions
                      cachedAnnotations
                      isCancelled
                  }
              }
          }
      }
    `,
    variables: {
      event: `${eventNameToKompassiEventName(eventName)}${eventYear}`,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const responseData = await response.json();
  const result = KompassiResponseSchema.safeParse(responseData);
  if (!result.success) {
    logger.error(
      new Error("Invalid Kompassi response format", { cause: result.error }),
    );
    return makeErrorResult(KompassiError.INVALID_RESPONSE);
  }
  return makeSuccessResult(result.data.data.event.program.programs);
};

const checkMissingKonstiProgramType = async (): Promise<void> => {
  const eventProgramItemsResult = await getFullProgramFromServer();
  if (!eventProgramItemsResult.ok) {
    return;
  }

  const eventProgramItems = eventProgramItemsResult.value;

  logger.info(`Loaded ${eventProgramItems.length} event program items`);

  const programItems = eventProgramItems.flatMap((eventProgramItem) => {
    const result = ProgramItemSchema.safeParse(eventProgramItem);
    if (!result.success) {
      logger.error(
        new Error("Error parsing program item", { cause: result.error }),
      );
      return [];
    }
    return result.data;
  });

  const missingKonstiProgramType = programItems.filter((programItem) => {
    const hasKonstiAnnotations =
      programItem.cachedAnnotations["konsti:minAttendance"] !== undefined ||
      programItem.cachedAnnotations["konsti:maxAttendance"] !== undefined;
    const hasKonstiRegistration =
      programItem.cachedDimensions.registration.includes("konsti");

    return (
      !programItem.isCancelled &&
      !programItem.cachedDimensions.registration.includes("not-required") &&
      !programItem.cachedDimensions.registration.includes("other") &&
      !programItem.cachedDimensions.registration.includes("gamepoint") &&
      !programItem.cachedDimensions.registration.includes("experience-point") &&
      !programItem.cachedDimensions.type.includes("presentation") &&
      (hasKonstiAnnotations || hasKonstiRegistration) &&
      programItem.cachedDimensions.konsti.length === 0
    );
  });

  if (missingKonstiProgramType.length === 0) {
    logger.info(
      "No program items with Konsti annotations or Konsti registration but missing Konsti program type",
    );
    return;
  }

  logger.info(
    `Found ${missingKonstiProgramType.length} program items with Konsti annotations or Konsti registration but missing Konsti program type:`,
  );

  const sortedByFormAndType = sortBy(
    missingKonstiProgramType,
    (programItem) =>
      programItem.cachedDimensions.registration.includes("konsti") ? 0 : 1,
    (programItem) => programItem.cachedDimensions.form.join(", "),
    (programItem) => programItem.cachedDimensions.type.join(", "),
  );

  for (const programItem of sortedByFormAndType) {
    const form =
      programItem.cachedDimensions.form.length > 0
        ? programItem.cachedDimensions.form.join(", ")
        : "-";
    const type =
      programItem.cachedDimensions.type.length > 0
        ? programItem.cachedDimensions.type.join(", ")
        : "-";
    const registration =
      programItem.cachedDimensions.registration.length > 0
        ? programItem.cachedDimensions.registration.join(", ")
        : "-";
    const minAttendance =
      programItem.cachedAnnotations["konsti:minAttendance"] ?? "-";
    const maxAttendance =
      programItem.cachedAnnotations["konsti:maxAttendance"] ?? "-";

    const message = `${programItem.title} (registration: ${registration}, form: ${form}, type: ${type}, minAttendance: ${minAttendance}, maxAttendance: ${maxAttendance})`;

    // Konsti registration without Konsti program type is a clear misconfiguration
    if (programItem.cachedDimensions.registration.includes("konsti")) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  }
};

try {
  await checkMissingKonstiProgramType();
} catch (error: unknown) {
  logger.error(error);
}
