import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";
import { UserGroup } from "shared/typings/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";

export const postSentryTunnel = (
  req: Request<{}, {}, null>,
  res: Response,
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TUNNEL}`);

  if (req.body) {
    resendSentryRequest(req.body).catch((error) => {
      logger.error("resendSentryRequest failed: %s", error);
    });
  }

  return res.sendStatus(200);
};

export const getSentryTest = (
  req: Request<{}, {}, null>,
  res: Response,
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TEST}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  // eslint-disable-next-line no-restricted-syntax -- Test error
  throw new Error("Test Sentry error");
};
