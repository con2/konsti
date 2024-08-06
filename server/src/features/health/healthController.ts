import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const getHealthStatus = (_req: Request, res: Response): Response => {
  logger.info(`API call: GET ${ApiEndpoint.HEALTH}`);
  return res.sendStatus(200);
};
