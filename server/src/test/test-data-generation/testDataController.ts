import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { POPULATE_DB_ENDPOINT } from "shared/constants/apiEndpoints";

import { runGenerators } from "server/test/test-data-generation/runGenerators";

export const postPopulateDb = async (
  req: Request<{}, {}, null>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${POPULATE_DB_ENDPOINT}`);
  await runGenerators(
    { clean: true, users: true, games: true, signups: true, entered: true },
    { closeDb: false }
  );
  return res.sendStatus(200);
};
