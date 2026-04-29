import express from "express";
import { z } from "zod";
import { postSentryTunnel } from "server/features/sentry-tunnel/sentryTunnelController";
import { validateBody } from "server/middleware/validateRequest";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const sentryRoutes = express.Router();

/* POST routes */

sentryRoutes.post(
  ApiEndpoint.SENTRY_TUNNEL,
  express.raw({ limit: "100mb", type: () => true }),
  validateBody(z.instanceof(Buffer)),
  postSentryTunnel,
);
