import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";

export const postSentryTunnel = async (
  req: Request<{}, {}, null>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TUNNEL}`);

  if (!req.body) return res.sendStatus(422);
  const response = await resendSentryRequest(req.body);
  return res.json(response);
};
