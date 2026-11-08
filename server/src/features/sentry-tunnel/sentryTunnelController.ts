import { Request, Response } from "express";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";
import { logger } from "server/utils/logger";

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

// Each log is its own Sentry event, one per cause shape, so the shapes can be checked
// separately: an Error cause becomes a linked exception, a non-Error one the `cause` extra
export const getSentryTest = (_req: Request, _res: Response): Response => {
  logger.error(new Error("Sentry test error: logger.error()"));
  logger.error(
    new Error("Sentry test error: logger.error() with Error cause", {
      cause: new Error("Sentry test error: Error cause"),
    }),
  );
  logger.error(
    new Error("Sentry test error: logger.error() with string cause", {
      cause: "Sentry test error: string cause",
    }),
  );
  logger.error(
    new Error("Sentry test error: logger.error() with object cause", {
      cause: { code: "SENTRY_TEST" },
    }),
  );

  // eslint-disable-next-line no-restricted-syntax -- Test error
  throw new Error("Sentry test error: uncaught exception", {
    cause: new Error("Sentry test error: uncaught exception cause"),
  });
};
