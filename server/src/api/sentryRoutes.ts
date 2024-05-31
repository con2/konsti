import express from "express";
import { postSentryTunnel } from "server/features/sentry-tunnel/sentryTunnelController";
import { ApiEndpoint } from "shared/constants/apiEndpoints";

export const sentryRoutes = express.Router();

/* POST routes */

sentryRoutes.post(
  ApiEndpoint.SENTRY_TUNNEL,
  express.raw({ limit: "100mb", type: () => true }),
  postSentryTunnel,
);
