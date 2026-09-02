import express from "express";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { getHealthStatus } from "server/features/health/healthController";
import { allowCORS } from "server/middleware/cors";

// A router of its own so it can stay mounted on an instance that serves no
// client traffic, which the deployment's liveness and readiness probes need
export const healthRoutes = express.Router();

/* GET routes */

// Route-level middleware, not router-level: this router is mounted at the app
// root, so a `use` here would open CORS on every path the cronjob-only instance
// is there to close off. Needed at all because the client's network probe
// fetches this cross-origin from its own dev server.
// The deployment probes this every few seconds, so it is deliberately left out
// of the access log.
healthRoutes.get(ApiEndpoint.HEALTH, allowCORS, getHealthStatus);
