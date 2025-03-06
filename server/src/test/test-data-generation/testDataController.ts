import { Request, Response } from "express";
import { z } from "zod";
import { logger } from "server/utils/logger";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import { runGenerators } from "server/test/test-data-generation/runGenerators";
import { PopulateDbOptionsSchema } from "shared/test-types/api/testData";
import { cleanupDatabase } from "server/utils/cleanupDatabse";
import { ProgramItemSchema } from "shared/types/models/programItem";
import { saveSerials } from "server/features/serial/serialRepository";
import { unsafelyUnwrap } from "server/test/utils/unsafelyUnwrapResult";
import { saveProgramItems } from "server/features/program-item/programItemRepository";
import { testProgramItem } from "shared/tests/testProgramItem";

export const postPopulateDb = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  logger.info(`API call: POST ${ApiDevEndpoint.POPULATE_DB}`);

  const result = PopulateDbOptionsSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postPopulateDb body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const {
    clean,
    users,
    programItems,
    lotterySignups,
    directSignups,
    eventLog,
  } = result.data;

  await runGenerators(
    {
      clean,
      users,
      programItems,
      lotterySignups,
      directSignups,
      eventLog,
    },
    { closeDb: false },
  );

  return res.sendStatus(200);
};

export const postClearDb = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  logger.info(`API call: POST ${ApiDevEndpoint.CLEAR_DB}`);
  await cleanupDatabase();
  return res.sendStatus(200);
};

export const postAddProgramItems = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  logger.info(`API call: POST ${ApiDevEndpoint.ADD_PROGRAM_ITEMS}`);

  const result = z.array(ProgramItemSchema.partial()).safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postAddProgramItems body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  if (result.data.length === 0) {
    await saveProgramItems([testProgramItem]);
  } else {
    await saveProgramItems(
      result.data.map((programItem) => ({
        ...testProgramItem,
        ...programItem,
      })),
    );
  }

  return res.sendStatus(200);
};

export const postAddSerials = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-restricted-syntax -- Data generation script
    throw new Error(`Data creation not allowed in production`);
  }

  logger.info(`API call: POST ${ApiDevEndpoint.ADD_SERIALS}`);

  const result = z.object({ count: z.number() }).safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postAddSerials body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const serials = unsafelyUnwrap(await saveSerials(result.data.count));

  return res.json(serials.map((serial) => serial.serial));
};
