import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";

export const postSentryTunnel = (
  req: Request<unknown, unknown, Buffer>,
  res: Response,
): Response => {
  resendSentryRequest(req.body).catch((error: unknown) => {
    logger.error("resendSentryRequest failed: %s", error);
  });

  return res.sendStatus(200);
};

export const getSentryTest = (_req: Request, _res: Response): Response => {
  logger.error("%s", new Error("Sentry test error: logger.error()"));

  // eslint-disable-next-line no-restricted-syntax -- Test error
  throw new Error("Sentry test error: uncaught exception");
};
