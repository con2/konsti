import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { runGenerators } from "server/test/test-data-generation/runGenerators";
import { PopulateDbOptionsSchema } from "shared/test-types/api/populateDb";

export const postPopulateDb = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.POPULATE_DB}`);

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
