import { Request, Response } from "express";
import { z } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { resendSentryRequest } from "server/features/sentry-tunnel/sentryTunnelService";
import { UserGroup } from "shared/types/models/user";
import { getAuthorizedUsername } from "server/utils/authHeader";

const PostSentryTunnelRequestSchema = z.instanceof(Buffer);

export const postSentryTunnel = (req: Request, res: Response): Response => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TUNNEL}`);

  const result = PostSentryTunnelRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postSentryTunnel body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  resendSentryRequest(result.data).catch((error: unknown) => {
    logger.error("resendSentryRequest failed: %s", error);
  });

  return res.sendStatus(200);
};

export const getSentryTest = (req: Request, res: Response): Response => {
  logger.info(`API call: POST ${ApiEndpoint.SENTRY_TEST}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.ADMIN,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  logger.error("%s", new Error("Sentry test error: logger.error()"));

  // eslint-disable-next-line no-restricted-syntax -- Test error
  throw new Error("Sentry test error: uncaught exception");
};
