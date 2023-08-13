import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

import { runGenerators } from "server/test/test-data-generation/runGenerators";

export const postPopulateDb = async (
  _req: Request<{}, {}, {}>,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.POPULATE_DB}`);
  await runGenerators(
    { clean: true, users: true, games: true, signups: true, entered: true },
    { closeDb: false },
  );
  return res.sendStatus(200);
};
