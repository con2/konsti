import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { runGenerators } from "server/test/test-data-generation/runGenerators";

export const postPopulateDb = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.POPULATE_DB}`);

  const {
    clean,
    users,
    programItems,
    lotterySignups,
    directSignups,
    eventLog,
  } = req.body;

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
