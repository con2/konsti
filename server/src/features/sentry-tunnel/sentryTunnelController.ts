import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";
import { UserGroup } from "shared/typings/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";

export const postSentryTunnel = async (
  req: Request<{}, {}, null>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TUNNEL}`);

  if (!req.body) return res.sendStatus(422);
  const response = await resendSentryRequest(req.body);
  return res.json(response);
};

export const getSentryTest = (
  req: Request<{}, {}, null>,
  res: Response
): Response => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TEST}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN
  );
  if (!username) {
    return res.sendStatus(401);
  }

  // eslint-disable-next-line no-restricted-syntax -- Test error
  throw new Error("Test Sentry error");
};
