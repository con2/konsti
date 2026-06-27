import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";

export const postSentryTunnel = (
  req: Request<unknown, unknown, Buffer>,
  res: Response,
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TUNNEL}`);

  // Fire-and-forget: respond to the Sentry client immediately without awaiting the resend
  void (async () => {
    try {
      await resendSentryRequest(req.body);
    } catch (error: unknown) {
      logger.error(new Error("resendSentryRequest failed", { cause: error }));
    }
  })();

  return res.sendStatus(200);
};

export const getSentryTest = (_req: Request, _res: Response): Response => {
  logger.error(new Error("Sentry test error: logger.error()"));

  // eslint-disable-next-line no-restricted-syntax -- Test error
  throw new Error("Sentry test error: uncaught exception");
};
